'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')

Test.beforeEach('Use route-specific rate limit,', async ({ context }) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib'),
    options: {
      max: 10,
      ipWhitelist: ['1.1.1.1'],
      namespace: `ip-whitelist-${Date.now()}`
    }
  })

  await server.initialize()
  context.server = server
})

Test('skips rate limiting for whitelisted IP address', async (t) => {
  const server = t.context.server

  server.route({
    method: 'GET',
    path: '/whitelist',
    handler: () => 'This is rate limitoooooooor!'
  })

  const request = {
    url: '/whitelist',
    method: 'GET',
    headers: {
      'x-forwarded-for': '1.1.1.1'
    }
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], undefined)
  t.is(response.headers['x-rate-limit-remaining'], undefined)
  t.is(response.headers['x-rate-limit-reset'], undefined)
})

Test('rate-limits non-whitelisted IP address', async (t) => {
  const server = t.context.server

  server.route({
    method: 'GET',
    path: '/whitelist',
    handler: () => 'This is rate limitoooooooor!'
  })

  const request = {
    url: '/whitelist',
    method: 'GET',
    headers: {
      'x-forwarded-for': '4.4.4.4'
    }
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 10)
  t.is(response.headers['x-rate-limit-remaining'], 9)
  t.truthy(response.headers['x-rate-limit-reset'])
})
