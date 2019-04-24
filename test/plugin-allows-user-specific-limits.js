'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')

async function initializeServer (options) {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib/index'),
    options: Object.assign({
      max: 1000,
      duration: 25 * 1000,
      namespace: `user-limits-${Date.now()}`
    }, options)
  })

  server.route({
    method: 'GET',
    path: '/',
    handler: () => {
      return 'This is rate limitoooooooor!'
    }
  })

  await server.initialize()

  return server
}

Test.beforeEach('Use user-specific rate limit,', async ({ context }) => {
  context.server = await initializeServer({
    userAttribute: 'id',
    userLimitAttribute: 'rateLimit'
  })
})

Test('succeeds an authenticated request and uses user-specific limit', async (t) => {
  const request = {
    url: '/',
    method: 'GET',
    auth: {
      strategy: 'default',
      credentials: {
        id: 'marcus-user-limit-1',
        name: 'Marcus',
        rateLimit: 2500
      }
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
    auth: {
      strategy: 'default',
      credentials: {
        id: 'marcus-user-limit-2',
        name: 'Marcus'
      }
    }
  }

  const response = await t.context.server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 1000)
  t.is(response.headers['x-rate-limit-remaining'], 999)
  t.not(response.headers['x-rate-limit-reset'], null)
})

Test('applies user-specific rate limits even for chaning IPs', async (t) => {
  const credentials = {
    id: 'marcus-user-limit-3',
    name: 'Marcus',
    rateLimit: 5000
  }

  const request1 = {
    url: '/',
    method: 'GET',
    headers: {
      'x-forwarded-for': '1.2.3.4'
    },
    auth: {
      strategy: 'default',
      credentials
    }
  }

  const response = await t.context.server.inject(request1)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 5000)
  t.is(response.headers['x-rate-limit-remaining'], 4999)
  t.not(response.headers['x-rate-limit-reset'], null)

  const request2 = {
    url: '/',
    method: 'GET',
    headers: {
      'x-forwarded-for': '5.6.7.8'
    },
    auth: {
      strategy: 'default',
      credentials
    }
  }

  const response2 = await t.context.server.inject(request2)
  t.is(response2.statusCode, 200)
  t.is(response2.headers['x-rate-limit-limit'], 5000)
  t.is(response2.headers['x-rate-limit-remaining'], 4998)
  t.not(response2.headers['x-rate-limit-reset'], null)
})

Test('use user-specific limits even without a userKey', async (t) => {
  const server = await initializeServer({
    max: 100,
    userLimitAttribute: 'rateLimit'
  })

  const request = {
    url: '/',
    method: 'GET',
    headers: {
      'x-forwarded-for': '1.2.3.4'
    },
    auth: {
      strategy: 'default',
      credentials: {
        name: 'Marcus',
        rateLimit: 2000
      }
    }
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 2000)
  t.is(response.headers['x-rate-limit-remaining'], 1999)
  t.not(response.headers['x-rate-limit-reset'], null)
})
