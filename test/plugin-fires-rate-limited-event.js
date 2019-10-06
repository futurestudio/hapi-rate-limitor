'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')
const pEvent = require('p-event')
const EventEmitter = require('events')

const rejectIn1Sec = new Promise((resolve, reject) => {
  setTimeout(reject, 1000, new Error('rejected after 1s'))
})

Test('falls back to server.events by default', async (t) => {
  const server = new Hapi.Server()

  await server.register({
    plugin: require('../lib'),
    options: {
      namespace: `events-${Date.now()}`
    }
  })

  await server.initialize()

  server.route({
    method: 'GET',
    path: '/',
    handler: () => 'server.events is the emitter'
  })

  const request = {
    url: '/',
    method: 'GET'
  }

  const events = []

  server.events.on('rate-limit:attempt', request => events.push(request))
  server.events.on('rate-limit:in-quota', request => events.push(request))
  server.events.on('rate-limit:exceeded', request => events.push(request))

  const response = await server.inject(request)
  t.is(response.statusCode, 200)

  t.is(events.length, 2) // should not contain the exceeded event
})

Test('uses custom event emitter', async (t) => {
  const server = new Hapi.Server()
  const emitter = new EventEmitter()

  await server.register({
    plugin: require('../lib'),
    options: {
      emitter,
      namespace: `events-${Date.now()}`
    }
  })

  await server.initialize()

  server.route({
    method: 'GET',
    path: '/',
    handler: () => 'custom event emitter'
  })

  const request = {
    url: '/',
    method: 'GET'
  }

  const attempt = pEvent(emitter, 'rate-limit:attempt')
  const inQuota = pEvent(emitter, 'rate-limit:in-quota')

  const response = await server.inject(request)
  t.is(response.statusCode, 200)

  t.truthy(await attempt)
  t.truthy(await inQuota)
})

Test('fires exceeded event', async (t) => {
  const server = new Hapi.Server()
  const emitter = new EventEmitter()

  await server.register({
    plugin: require('../lib'),
    options: {
      max: 1,
      emitter,
      namespace: `events-${Date.now()}`
    }
  })

  await server.initialize()

  server.route({
    method: 'GET',
    path: '/',
    handler: () => 'custom event emitter'
  })

  const request = {
    url: '/',
    method: 'GET'
  }

  const attempt = pEvent(emitter, 'rate-limit:attempt')
  const exceeded = pEvent(emitter, 'rate-limit:exceeded')

  // first request won’t exceed the rate limit
  const response = await server.inject(request)
  t.is(response.statusCode, 200)
  t.truthy(await attempt)
  await t.throwsAsync(Promise.race([exceeded, rejectIn1Sec]))

  // second request exceeds the limit
  await server.inject(request)
  t.truthy(Promise.race([exceeded, rejectIn1Sec]))
})
