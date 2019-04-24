'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')

async function initializeServer (options) {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib/index'),
    options: Object.assign({
      namespace: `disabled-rate-limits-${Date.now()}`
    }, options)
  })

  await server.initialize()

  return server
}

Test('Disable the rate limiting plugin', async (t) => {
  const server = await initializeServer({ enabled: false })

  server.route({
    method: 'GET',
    path: '/',
    handler: () => 'success'
  })

  const request = {
    url: '/',
    method: 'GET'
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], undefined)
  t.is(response.headers['x-rate-limit-remaining'], undefined)
  t.is(response.headers['x-rate-limit-reset'], undefined)
})

Test('Disable rate limiting on a route', async (t) => {
  const server = await initializeServer({ enabled: true })

  server.route({
    method: 'GET',
    path: '/',
    options: {
      plugins: {
        'hapi-rate-limitor': {
          enabled: false
        }
      },
      handler: () => 'success'
    }
  })

  const requestDisabled = {
    url: '/',
    method: 'GET'
  }

  const responseDisabled = await server.inject(requestDisabled)
  t.is(responseDisabled.statusCode, 200)
  t.is(responseDisabled.headers['x-rate-limit-limit'], undefined)
  t.is(responseDisabled.headers['x-rate-limit-remaining'], undefined)
  t.is(responseDisabled.headers['x-rate-limit-reset'], undefined)

  server.route({
    method: 'GET',
    path: '/enabled',
    options: {
      plugins: {
        'hapi-rate-limitor': {
          max: 5000,
          enabled: true
        }
      },
      handler: () => 'success'
    }
  })

  const requestEnabled = {
    url: '/enabled',
    method: 'GET'
  }

  const responseEnabled = await server.inject(requestEnabled)
  t.is(responseEnabled.statusCode, 200)
  t.is(responseEnabled.headers['x-rate-limit-limit'], 5000)
  t.is(responseEnabled.headers['x-rate-limit-remaining'], 4999)
  t.not(responseEnabled.headers['x-rate-limit-reset'], null)
})
