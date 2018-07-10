'use strict'

const Lab = require('lab')
const Code = require('code')
const Hapi = require('hapi')

const server = new Hapi.Server()

const Expect = Code.expect
const { describe, it, before } = (exports.lab = Lab.script())

describe('Send rate limit HTTP response headers,', () => {
  before(async () => {
    await server.register({
      plugin: require('../lib/index'),
      options: {
        max: 1,
        duration: 1000 * 60 * 15, // 15min
        namespace: `error-response-headers-${new Date()}`
      }
    })

    server.route({
      method: 'GET',
      path: '/',
      handler: request => {
        return 'This is rate limitoooooooor!'
      }
    })
  })

  it('sends rate limit error and rate limit response headers', async () => {
    const request = {
      url: '/',
      method: 'GET'
    }

    const response1 = await server.inject(request)
    Expect(response1.statusCode).to.equal(200)
    Expect(response1.headers['x-rate-limit-limit']).to.equal(1)
    Expect(response1.headers['x-rate-limit-remaining']).to.equal(0)
    Expect(response1.headers['x-rate-limit-reset']).to.exist()

    const response = await server.inject(request)
    Expect(response.statusCode).to.equal(429)
    Expect(response.headers['x-rate-limit-limit']).to.equal(1)
    Expect(response.headers['x-rate-limit-remaining']).to.equal(0)
    Expect(response.headers['x-rate-limit-reset']).to.exist()
  })
})
