'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')

const timeout = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

Test.before(async ({ context }) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib/index'),
    options: {
      max: 1,
      duration: 300,
      namespace: 'reset-response-headers'
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

Test('resets rate limit after window timeout', async (t) => {
  const request = {
    url: '/',
    method: 'GET'
  }

  const response = await t.context.server.inject(request)
  t.is(response.statusCode, 200)

  const response2 = await t.context.server.inject(request)
  t.is(response2.statusCode, 429)

  await timeout(300)

  const response3 = await t.context.server.inject(request)
  t.is(response3.statusCode, 200)
})
