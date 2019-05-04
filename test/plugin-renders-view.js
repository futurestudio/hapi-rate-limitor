'use strict'

const Test = require('ava')
const Path = require('path')
const Hapi = require('@hapi/hapi')
const Vision = require('@hapi/vision')
const Handlebars = require('handlebars')

async function setupServer (options) {
  const server = new Hapi.Server()

  await server.register([
    {
      plugin: Vision
    },
    {
      plugin: require('../lib'),
      options: Object.assign({
        view: 'rate-limit-exceeded',
        max: 1,
        duration: 1000,
        namespace: `view-limits-${Date.now()}`
      }, options)
    }])

  server.views({
    engines: {
      html: Handlebars
    },
    path: Path.resolve(__dirname, 'views')
  })

  await server.initialize()

  return server
}

Test('plugin renders a view', async (t) => {
  const server = await setupServer()

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

  const response1 = await server.inject(request)
  t.is(response1.statusCode, 200)
  t.is(response1.headers['x-rate-limit-limit'], 1)
  t.is(response1.headers['x-rate-limit-remaining'], 0)
  t.not(response1.headers['x-rate-limit-reset'], null)

  const response2 = await server.inject(request)
  t.is(response2.statusCode, 429)
  t.true(response2.payload.includes('You’ve exceeded the rate limit.'))
  t.is(response2.headers['x-rate-limit-limit'], 1)
  t.is(response2.headers['x-rate-limit-remaining'], 0)
  t.not(response2.headers['x-rate-limit-reset'], null)
})

Test('plugin fails for missing view', async (t) => {
  await t.throwsAsync(
    setupServer({ view: 'not-existing-view' })
  )
})
