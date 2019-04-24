'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')

Test.beforeEach('Render view when rate limit is exceeded,', async ({ context }) => {
  const server = new Hapi.Server()

  await server.register(require('@hapi/basic'))

  await server.auth.strategy('basic', 'basic', {
    validate: () => {
      return { isValid: false }
    }
  })

  context.server = server
})

Test('plugin rate limits request onPreAuth', async (t) => {
  const server = t.context.server

  await server.register([
    {
      plugin: require('../lib'),
      options: {
        max: 20,
        extensionPoint: 'onPreAuth',
        namespace: `view-limits-${Date.now()}`
      }
    }
  ])

  server.route({
    method: 'GET',
    path: '/',
    options: {
      auth: 'basic',
      handler: () => 'This is rate limitoooooooor!'
    }
  })

  const request = {
    url: '/',
    method: 'GET'
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 401)
  t.is(response.headers['x-rate-limit-limit'], 20)
  t.is(response.headers['x-rate-limit-remaining'], 19)
  t.not(response.headers['x-rate-limit-reset'], undefined)
})

Test('plugin does not rate limit at onPostAuth because auth fails', async (t) => {
  const server = t.context.server

  await server.register([
    {
      plugin: require('../lib'),
      options: {
        max: 20,
        extensionPoint: 'onPostAuth',
        namespace: `view-limits-${Date.now()}`
      }
    }
  ])

  server.route({
    method: 'GET',
    path: '/',
    options: {
      auth: 'basic',
      handler: () => 'This is rate limitoooooooor!'
    }
  })

  const request = {
    url: '/',
    method: 'GET'
  }

  const response = await server.inject(request)

  t.is(response.statusCode, 401)
  t.is(response.headers['x-rate-limit-limit'], undefined)
  t.is(response.headers['x-rate-limit-remaining'], undefined)
  t.is(response.headers['x-rate-limit-reset'], undefined)
})
