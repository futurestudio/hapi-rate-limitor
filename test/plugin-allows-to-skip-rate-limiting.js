'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')

async function initializeServer () {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib/index'),
    options: {
      skip: request => {
        return request.path.includes('/admin')
      },
      max: 100,
      namespace: `skip-rate-limiting-${Date.now()}`
    }
  })

  await server.initialize()

  return server
}

Test('Skips rate limiting when skip() returns true', async (t) => {
  const server = await initializeServer()

  server.route({
    method: 'GET',
    path: '/admin/test',
    handler: () => 'success'
  })

  const request = {
    url: '/admin/test',
    method: 'GET'
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], undefined)
  t.is(response.headers['x-rate-limit-remaining'], undefined)
  t.is(response.headers['x-rate-limit-reset'], undefined)
})

Test('Does not skip rate limiting when skip() returns false', async (t) => {
  const server = await initializeServer()

  server.route({
    method: 'GET',
    path: '/',
    handler: () => 'success'
  })

  const requestDisabled = {
    url: '/',
    method: 'GET'
  }

  const response = await server.inject(requestDisabled)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], 100)
  t.is(response.headers['x-rate-limit-remaining'], 99)
  t.not(response.headers['x-rate-limit-reset'], undefined)
})

Test('Skips rate limiting when skip() returns false, but not enabled on route', async (t) => {
  const server = await initializeServer()

  server.route({
    method: 'GET',
    path: '/',
    options: {
      plugins: { 'hapi-rate-limitor': { enabled: false } },
      handler: () => 'success'
    }
  })

  const requestDisabled = {
    url: '/',
    method: 'GET'
  }

  const response = await server.inject(requestDisabled)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], undefined)
  t.is(response.headers['x-rate-limit-remaining'], undefined)
  t.is(response.headers['x-rate-limit-reset'], undefined)
})

Test('Skips rate limiting when enabled on route, but skip() returns true', async (t) => {
  const server = await initializeServer()

  server.route({
    method: 'GET',
    path: '/admin',
    options: {
      plugins: { 'hapi-rate-limitor': { enabled: true } },
      handler: () => 'success'
    }
  })

  const requestDisabled = {
    url: '/admin',
    method: 'GET'
  }

  const response = await server.inject(requestDisabled)
  t.is(response.statusCode, 200)
  t.is(response.headers['x-rate-limit-limit'], undefined)
  t.is(response.headers['x-rate-limit-remaining'], undefined)
  t.is(response.headers['x-rate-limit-reset'], undefined)
})
