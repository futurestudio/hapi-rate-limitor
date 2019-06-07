'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')

Test('Connects to Redis using an Object', async (t) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib'),
    options: {
      redis: { host: 'localhost' },
      namespace: `route-limits-${Date.now()}`
    }
  })

  t.is(server._core.extensions.server.onPreStart._topo.nodes.length, 1)
  t.is(server._core.extensions.server.onPostStop._topo.nodes.length, 1)
})

Test('Connects to Redis using a connection string', async (t) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib'),
    options: {
      redis: 'redis://localhost',
      namespace: `route-limits-${Date.now()}`
    }
  })

  await server.start()
  await server.stop()

  t.pass()
})

Test('Fails to connect to Redis', async (t) => {
  const server = new Hapi.Server()

  await t.throwsAsync(
    server.register({
      plugin: require('../lib'),
      options: {
        redis: false,
        namespace: `route-limits-${Date.now()}`
      }
    })
  )
})
