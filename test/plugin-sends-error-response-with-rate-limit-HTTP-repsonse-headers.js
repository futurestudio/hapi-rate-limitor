'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')

Test.before(async ({ context }) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib/index'),
    options: {
      max: 1,
      duration: 1000 * 15,
      namespace: `error-response-headers-${new Date()}`
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

Test('sends rate limit error and rate limit response headers', async (t) => {
  const request = {
    url: '/',
    method: 'GET'
  }

  const response1 = await t.context.server.inject(request)
  t.is(response1.statusCode, 200)
  t.is(response1.headers['x-rate-limit-limit'], 1)
  t.is(response1.headers['x-rate-limit-remaining'], 0)
  t.not(response1.headers['x-rate-limit-reset'], null)

  const response = await t.context.server.inject(request)
  t.is(response.statusCode, 429)
  t.is(response.headers['x-rate-limit-limit'], 1)
  t.is(response.headers['x-rate-limit-remaining'], 0)
  t.not(response.headers['x-rate-limit-reset'], null)
})
