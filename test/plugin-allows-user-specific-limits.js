'use strict'

const Lab = require('lab')
const Code = require('code')
const Hapi = require('hapi')

let server

const Expect = Code.expect
const { describe, it, beforeEach } = (exports.lab = Lab.script())

describe('Use user-specific rate limit,', () => {
  beforeEach(async () => {
    server = new Hapi.Server()

    await server.register({
      plugin: require('../lib/index'),
      options: {
        max: 1000,
        duration: 25 * 1000, // 25s
        namespace: `user-limits-${Date.now()}`,
        userLimitKey: 'rateLimit'
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

  it('succeeds an authenticated request and uses user-specific limit', async () => {
    const request = {
      url: '/',
      method: 'GET',
      credentials: {
        name: 'Marcus',
        rateLimit: 2500
      }
    }

    const response = await server.inject(request)
    Expect(response.statusCode).to.equal(200)
    Expect(response.headers['x-rate-limit-limit']).to.equal(2500)
    Expect(response.headers['x-rate-limit-remaining']).to.equal(2499)
    Expect(response.headers['x-rate-limit-reset']).to.exist()
  })

  it('succeeds an authenticated request without user-specific rate limit (fallback to default limit)', async () => {
    const request = {
      url: '/',
      method: 'GET',
      credentials: {
        name: 'Marcus'
      }
    }

    const response1 = await server.inject(request)
    Expect(response1.statusCode).to.equal(200)
    Expect(response1.headers['x-rate-limit-limit']).to.equal(1000)
    Expect(response1.headers['x-rate-limit-remaining']).to.equal(999)
    Expect(response1.headers['x-rate-limit-reset']).to.exist()
  })
})
