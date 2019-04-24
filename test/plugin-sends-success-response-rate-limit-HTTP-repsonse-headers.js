'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')

Test.before(async ({ context }) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib/index'),
    options: {
      max: 1000,
      duration: 5 * 1000,
      namespace: 'success-response-headers'
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

Test('succeeds a request and sends rate limit response headers', async (t) => {
  const request = {
    url: '/',
    method: 'GET'
  }

  const response = await t.context.server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 1000)
  t.is(response.headers['x-rate-limit-remaining'], 999)
  t.not(response.headers['x-rate-limit-reset'], null)
})

Test('succeeds requests with different IP addresses and sends rate limit response headers', async (t) => {
  const first = {
    url: '/',
    method: 'GET',
    headers: {
      'X-Client-IP': '1.2.3.4'
    }
  }

  const response1 = await t.context.server.inject(first)
  t.is(response1.statusCode, 200)
  t.is(response1.headers['x-rate-limit-limit'], 1000)
  t.is(response1.headers['x-rate-limit-remaining'], 999)
  t.not(response1.headers['x-rate-limit-reset'], null)

  const second = {
    url: '/',
    method: 'GET',
    headers: {
      'X-Client-IP': '9.8.7.6'
    }
  }

  const response2 = await t.context.server.inject(second)
  t.is(response2.statusCode, 200)
  t.is(response2.headers['x-rate-limit-limit'], 1000)
  t.is(response2.headers['x-rate-limit-remaining'], 999)
  t.not(response2.headers['x-rate-limit-reset'], null)
})

Test('succeeds a 404 request and sends rate limit response headers', async (t) => {
  const request = {
    url: '/404',
    method: 'GET',
    headers: {
      'X-Client-IP': '11.22.33.44'
    }
  }

  const response = await t.context.server.inject(request)
  t.is(response.statusCode, 404)
  t.is(response.headers['x-rate-limit-limit'], undefined)
  t.is(response.headers['x-rate-limit-remaining'], undefined)
  t.is(response.headers['x-rate-limit-reset'], undefined)
})
