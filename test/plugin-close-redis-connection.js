'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')
const RateLimiter = require('../lib/rate-limiter')

Test('Registers onPreStart and onPostStop extensions', async (t) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib'),
    options: {
      namespace: `route-limits-${Date.now()}`
    }
  })

  t.is(server._core.extensions.server.onPreStart._topo.nodes.length, 1)
  t.is(server._core.extensions.server.onPostStop._topo.nodes.length, 1)
})

Test('Connects to Redis onPreStart and closes Redis connection onPostStop', async (t) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib'),
    options: {
      namespace: `route-limits-${Date.now()}`
    }
  })

  await server.start()
  await server.stop()

  t.pass()
})

Test('Connect and disconnect from Redis on limiter start and stop', async (t) => {
  const limiter = new RateLimiter({})
  t.is(limiter.redis.status, 'wait')

  await limiter.start()
  t.is(limiter.redis.status, 'ready')

  await limiter.stop()
})
