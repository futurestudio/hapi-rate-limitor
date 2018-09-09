'use strict'

const Test = require('ava')
const Hapi = require('hapi')

Test.beforeEach('Use user-specific rate limit,', async ({ context }) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib'),
    options: {
      max: 1000,
      duration: 25 * 1000, // 25s
      namespace: `route-limits-${Date.now()}`,
      userLimitKey: 'rateLimit'
    }
  })

  await server.initialize()
  context.server = server
})

Test('uses the route-specific limit', async (t) => {
  const server = t.context.server

  server.route({
    method: 'GET',
    path: '/route-limit',
    config: {
      plugins: {
        'hapi-rate-limitor': {
          max: 10,
          duration: 1000 * 60 // per minute
        }
      },
      handler: () => {
        return 'This is rate limitoooooooor!'
      }
    }
  })

  const request = {
    url: '/route-limit',
    method: 'GET'
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 10)
  t.is(response.headers['x-rate-limit-remaining'], 9)
  t.not(response.headers['x-rate-limit-reset'], null)
})

Test('succeeds an authenticated request without route-specific rate limit and uses the route-limit, not user-limit', async (t) => {
  const server = t.context.server

  server.route({
    method: 'GET',
    path: '/route-limit-overrides-user-limit',
    config: {
      plugins: {
        'hapi-rate-limitor': {
          max: 10,
          duration: 60 * 1000 // 60s
        }
      },
      handler: () => {
        return 'This is rate limitoooooooor!'
      }
    }
  })

  const request = {
    url: '/route-limit-overrides-user-limit',
    method: 'GET',
    credentials: {
      id: 'marcus-route-limit-1',
      name: 'Marcus'
    }
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 10)
  t.is(response.headers['x-rate-limit-remaining'], 9)
  t.not(response.headers['x-rate-limit-reset'], null)
})
