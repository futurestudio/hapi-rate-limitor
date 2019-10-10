'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')

Test('uses getIp to detect the IP address', async (t) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib'),
    options: {
      max: 10,
      getIp: async (request) => {
        return request.headers['rate-limitor-ip']
      },
      namespace: `getip-${Date.now()}`
    }
  })

  await server.initialize()

  server.route({
    method: 'GET',
    path: '/getIp',
    handler: request => request.headers['rate-limitor-ip']
  })

  const request = {
    url: '/getIp',
    method: 'GET',
    headers: {
      'rate-limitor-ip': '1.2.3.4'
    }
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.result, '1.2.3.4')
  t.is(response.headers['x-rate-limit-limit'], 10)
  t.is(response.headers['x-rate-limit-remaining'], 9)
  t.truthy(response.headers['x-rate-limit-reset'])
})

Test('falls back to request IP', async (t) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib'),
    options: {
      max: 10,
      namespace: `getip-${Date.now()}`
    }
  })

  await server.initialize()

  server.route({
    method: 'GET',
    path: '/getIp',
    handler: request => request.headers['x-forwarded-for']
  })

  const request = {
    url: '/getIp',
    method: 'GET',
    headers: {
      'x-forwarded-for': '4.4.4.4'
    }
  }

  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.is(response.result, '4.4.4.4')
  t.is(response.headers['x-rate-limit-limit'], 10)
  t.is(response.headers['x-rate-limit-remaining'], 9)
  t.truthy(response.headers['x-rate-limit-reset'])
})
