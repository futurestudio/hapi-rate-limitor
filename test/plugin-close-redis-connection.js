'use strict'

const Test = require('ava')
const Hapi = require('hapi')

Test('Check redis connection after server start and stop', async (t) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib'),
    options: {
      namespace: `route-limits-${Date.now()}`
    }
  })

  await server.initialize()
  const redis = server.plugins['hapi-rate-limitor'].limiter.getRedis()

  t.is(redis.status, 'connecting')

  await new Promise((resolve, reject) => {
    redis.on('connect', () => {
      return resolve()
    })
    redis.on('error', (err) => {
      return reject(err)
    })
  })
  t.is(redis.status, 'connect')

  await server.stop()

  await new Promise((resolve, reject) => {
    redis.on('close', () => {
      return resolve()
    })
    redis.on('error', (err) => {
      return reject(err)
    })
  })
  t.is(redis.status, 'end')
})
