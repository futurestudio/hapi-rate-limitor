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
        max: 1000,
        duration: 5 * 1000, // 5s
        namespace: 'success-response-headers'
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

  it('succeeds a request and sends rate limit response headers', async () => {
    const request = {
      url: '/',
      method: 'GET'
    }

    const response = await server.inject(request)
    Expect(response.statusCode).to.equal(200)
    Expect(response.headers['x-rate-limit-limit']).to.equal(1000)
    Expect(response.headers['x-rate-limit-remaining']).to.equal(999)
    Expect(response.headers['x-rate-limit-reset']).to.exist()
  })

  it('succeeds requests with different IP addresses and sends rate limit response headers', async () => {
    const first = {
      url: '/',
      method: 'GET',
      headers: {
        'X-Client-IP': '1.2.3.4'
      }
    }

    const response1 = await server.inject(first)
    Expect(response1.statusCode).to.equal(200)
    Expect(response1.headers['x-rate-limit-limit']).to.equal(1000)
    Expect(response1.headers['x-rate-limit-remaining']).to.equal(999)
    Expect(response1.headers['x-rate-limit-reset']).to.exist()

    const second = {
      url: '/',
      method: 'GET',
      headers: {
        'X-Client-IP': '9.8.7.6'
      }
    }

    const response2 = await server.inject(second)
    Expect(response2.statusCode).to.equal(200)
    Expect(response2.headers['x-rate-limit-limit']).to.equal(1000)
    Expect(response2.headers['x-rate-limit-remaining']).to.equal(999)
    Expect(response2.headers['x-rate-limit-reset']).to.exist()
  })
})
