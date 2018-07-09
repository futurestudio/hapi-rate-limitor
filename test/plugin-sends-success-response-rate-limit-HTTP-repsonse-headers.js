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
      handler: request => {
        return 'This is rate limitoooooooor!'
      }
    })
  })

  it('succeeds a request and receives rate limit response headers', async () => {
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

  it('stops the server on SIGINT', async () => {
  })
})
