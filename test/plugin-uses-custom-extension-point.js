'use strict'

const Test = require('ava')
const Hapi = require('hapi')

Test.beforeEach('Render view when rate limit is exceeded,', async ({ context }) => {
  const server = new Hapi.Server()

  await server.register([
    {
      plugin: require('../lib'),
      options: {
        max: 20,
        extensionPoint: 'onPreHandler',
        namespace: `view-limits-${Date.now()}`
      }
    }])

  await server.initialize()
  context.server = server
})

Test('plugin rate limits request onPreHandler', async (t) => {
  const server = t.context.server

  server.route({
    method: 'GET',
    path: '/',
    handler: () => 'This is rate limitoooooooor!'
  })

  const request = {
    url: '/',
    method: 'GET'
  }

  const response1 = await server.inject(request)
  t.is(response1.statusCode, 200)
  t.is(response1.headers['x-rate-limit-limit'], 20)
  t.is(response1.headers['x-rate-limit-remaining'], 19)
  t.not(response1.headers['x-rate-limit-reset'], null)
})
