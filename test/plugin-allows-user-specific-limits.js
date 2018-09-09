'use strict'

const Test = require('ava')
const Hapi = require('hapi')

Test.beforeEach('Use user-specific rate limit,', async ({ context }) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib/index'),
    options: {
      max: 1000,
      duration: 25 * 1000, // 25s
      namespace: `user-limits-${Date.now()}`,
      userLimitKey: 'rateLimit'
    }
  })

  server.route({
    method: 'GET',
    path: '/',
    handler: () => {
      return 'This is rate limitoooooooor!'
    }
  })

  await server.initialize()
  context.server = server
})

Test('succeeds an authenticated request and uses user-specific limit', async (t) => {
  const request = {
    url: '/',
    method: 'GET',
    credentials: {
      name: 'Marcus',
      rateLimit: 2500
    }
  }

  const response = await t.context.server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 2500)
  t.is(response.headers['x-rate-limit-remaining'], 2499)
  t.not(response.headers['x-rate-limit-reset'], null)
})

Test('succeeds an authenticated request without user-specific rate limit (fallback to default limit)', async (t) => {
  const request = {
    url: '/',
    method: 'GET',
    credentials: {
      name: 'Marcus'
    }
  }

  const response = await t.context.server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 1000)
  t.is(response.headers['x-rate-limit-remaining'], 999)
  t.not(response.headers['x-rate-limit-reset'], null)
})
