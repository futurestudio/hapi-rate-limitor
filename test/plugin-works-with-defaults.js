'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')

Test.beforeEach('Create server with rate limit defaults', async ({ context }) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib'),
    options: {
      namespace: `route-limits-${Date.now()}`
    }
  })

  await server.initialize()
  context.server = server
})

Test('runs with rate limit defaults', async (t) => {
  const server = t.context.server

  server.route({
    method: 'GET',
    path: '/',
    handler: () => {
      return 'This is rate limitoooooooor!'
    }
  })

  const request = {
    url: '/',
    method: 'GET'
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 60)
  t.is(response.headers['x-rate-limit-remaining'], 59)
  t.not(response.headers['x-rate-limit-reset'], null)
})
