'use strict'

const Test = require('ava')
const Hapi = require('hapi')

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
