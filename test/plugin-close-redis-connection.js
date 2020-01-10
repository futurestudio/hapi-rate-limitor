'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')
const RateLimiter = require('../lib/rate-limiter')

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
  const server = { event: () => {} }
  const limiter = new RateLimiter(server)
  t.is(limiter.redis.status, 'wait')

  await limiter.start()
  t.is(limiter.redis.status, 'ready')

  await limiter.stop()
})
