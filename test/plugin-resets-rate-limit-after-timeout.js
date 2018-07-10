'use strict'

const Lab = require('lab')
const Code = require('code')
const Hapi = require('hapi')
const Hoek = require('hoek')

const server = new Hapi.Server()

const Expect = Code.expect
const { describe, it, before } = (exports.lab = Lab.script())

describe('Reset rate limit after timeout,', () => {
  before(async () => {
    await server.register({
      plugin: require('../lib/index'),
      options: {
        max: 1,
        duration: 100, // 100ms
        namespace: 'reset-response-headers'
      }
    })

    server.route({
      method: 'GET',
      path: '/',
      handler: () => {
        return 'This is rate limitoooooooor!'
      }
    })

    await server.initialize()
  })

  it('resets rate limit after window timeout', async () => {
    const request = {
      url: '/',
      method: 'GET'
    }

    const response = await server.inject(request)
    Expect(response.statusCode).to.equal(200)

    const response2 = await server.inject(request)
    Expect(response2.statusCode).to.equal(429)

    await Hoek.wait(100)

    const response3 = await server.inject(request)
    Expect(response3.statusCode).to.equal(200)
  })
})
