'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')

Test('works with other plugins', async (t) => {
  const pluginA = {
    name: 'plugin-a',
    register: (server) => {
      server.ext('onPreResponse', (request, h) => {
        request.response.isBoom
          ? request.response.output.statusCode = 418
          : request.response.statusCode = 418

        return h.continue
      })
    }
  }

  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib'),
    options: {
      namespace: `route-limits-${Date.now()}`
    }
  })
  await server.register({ plugin: pluginA })

  await server.initialize()

  server.route({
    method: 'GET',
    path: '/',
    handler: () => {
      throw new Error('This should create a 500 HTTP status, but we’re overwriting it in pluginA to status 418')
    }
  })

  const request = {
    url: '/',
    method: 'GET'
  }

  // assert the response has the changed HTTP status code from pluginA and the rate limit headers from hapi-rate-limitor
  const response = await server.inject(request)
  t.is(response.statusCode, 418)
  t.is(response.headers['x-rate-limit-limit'], 60)
  t.is(response.headers['x-rate-limit-remaining'], 59)
  t.not(response.headers['x-rate-limit-reset'], null)
})
