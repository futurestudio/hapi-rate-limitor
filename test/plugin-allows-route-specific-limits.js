'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')

Test.beforeEach('Use route-specific rate limit,', async ({ context }) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib'),
    options: {
      max: 1000,
      duration: 1000,
      namespace: `route-limits-${Date.now()}`,
      userAttribute: 'id',
      userLimitAttribute: 'rateLimit'
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
    options: {
      plugins: {
        'hapi-rate-limitor': {
          max: 10,
          duration: 1000 * 60
        }
      },
      handler: () => 'This is rate limitoooooooor!'
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

Test('route limit is not affected by server-limit', async (t) => {
  const server = t.context.server

  server.route([
    {
      method: 'GET',
      path: '/',
      handler: () => 'Home'
    },
    {
      method: 'GET',
      path: '/route-limit',
      options: {
        plugins: {
          'hapi-rate-limitor': {
            max: 20,
            duration: 1000 * 60
          }
        },
        handler: () => 'This is rate limitoooooooor!'
      }
    }
  ])

  // at first, send a request against the GET / route with the global server-wide rate limit
  const homeResponse = await server.inject('/')
  t.is(homeResponse.headers['x-rate-limit-limit'], 1000)
  t.is(homeResponse.headers['x-rate-limit-remaining'], 999)

  // now go ahead and send a request against the route with a route-level max attempts config
  const request = {
    url: '/route-limit',
    method: 'GET'
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 20)
  t.is(response.headers['x-rate-limit-remaining'], 19)
  t.not(response.headers['x-rate-limit-reset'], null)

  const secondResponse = await server.inject(request)
  t.is(secondResponse.headers['x-rate-limit-remaining'], 18)

  // the global max attempts for the server should not be affected by the requests
  // against a route with route-level max attempts
  const secondHomeResponse = await server.inject('/')
  t.is(secondHomeResponse.headers['x-rate-limit-limit'], 1000)
  t.is(secondHomeResponse.headers['x-rate-limit-remaining'], 998)
})

Test('succeeds an authenticated request with route-specific rate limit and uses the route-limit, not default limit', async (t) => {
  const server = t.context.server

  server.route({
    method: 'GET',
    path: '/route-limit-overrides-user-limit',
    options: {
      plugins: {
        'hapi-rate-limitor': {
          max: 10,
          duration: 60 * 1000 // 60s
        }
      },
      handler: () => 'This is rate limitoooooooor!'
    }
  })

  const request = {
    url: '/route-limit-overrides-user-limit',
    method: 'GET',
    auth: {
      strategy: 'default',
      credentials: {
        id: 'marcus-route-limit-1',
        name: 'Marcus'
      }
    }
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 10)
  t.is(response.headers['x-rate-limit-remaining'], 9)
  t.not(response.headers['x-rate-limit-reset'], null)
})

Test('succeeds an authenticated request with user-specific limit and uses the route-limit, not user-limit', async (t) => {
  const server = t.context.server

  server.route({
    method: 'GET',
    path: '/route-limit-overrides-default-limit',
    options: {
      plugins: {
        'hapi-rate-limitor': {
          max: 15,
          duration: 60 * 1000 // 60s
        }
      },
      handler: () => 'This is rate limitoooooooor!'
    }
  })

  const request = {
    url: '/route-limit-overrides-default-limit',
    method: 'GET',
    auth: {
      strategy: 'default',
      credentials: {
        id: 'marcus-route-limit-1',
        limit: 123,
        name: 'Marcus',
        userAttribute: 'id',
        userLimitAttribute: 'limit'
      }
    }
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 15)
  t.is(response.headers['x-rate-limit-remaining'], 14)
  t.not(response.headers['x-rate-limit-reset'], null)
})

Test('does not change the default userIdKey config when set on routes', async (t) => {
  const server = t.context.server
  const url = '/route-limit-does-not-touch-identifiers'

  server.route({
    method: 'GET',
    path: url,
    options: {
      plugins: {
        'hapi-rate-limitor': {
          max: 10,
          duration: 60 * 1000, // 60s
          userIdKey: 'id'
        }
      },
      handler: () => {
        return 'This is rate limitoooooooor!'
      }
    }
  })

  const request = {
    url,
    method: 'GET',
    auth: {
      strategy: 'default',
      credentials: {
        id: 'marcus-route-limit-2',
        name: 'Marcus',
        rateLimit: 10000
      }
    }
  }

  const response1 = await server.inject(request)
  t.is(response1.statusCode, 200)
  t.is(response1.headers['x-rate-limit-limit'], 10)
  t.is(response1.headers['x-rate-limit-remaining'], 9)
  t.not(response1.headers['x-rate-limit-reset'], null)

  /**
   * A second route should identify a user the same way as defined
   * in the default settings. That means, a route config for
   * `userIdKey` does not affect the handling.
   */
  server.route({
    method: 'GET',
    path: `${url}-2`,
    options: {
      plugins: {
        'hapi-rate-limitor': {
          max: 10,
          duration: 60 * 1000, // 60s
          userIdKey: 'name'
        }
      },
      handler: () => {
        return 'This is rate limitoooooooor!'
      }
    }
  })

  const request2 = {
    url: `${url}-2`,
    method: 'GET',
    auth: {
      strategy: 'default',
      credentials: {
        id: 'marcus-route-limit-2',
        name: 'Marcus-2',
        rateLimit: 25000
      }
    }
  }

  const response2 = await server.inject(request2)
  t.is(response2.statusCode, 200)
  t.is(response2.headers['x-rate-limit-limit'], 10)
  t.is(response2.headers['x-rate-limit-remaining'], 9)
  t.not(response2.headers['x-rate-limit-reset'], null)
})
