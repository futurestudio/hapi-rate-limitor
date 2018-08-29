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
      plugin: require('../lib'),
      options: {
        max: 1000,
        duration: 25 * 1000, // 25s
        namespace: `route-limits-${Date.now()}`,
        userLimitKey: 'rateLimit'
      }
    })

    await server.initialize()
  })

  it('uses the route-specific limit', async () => {
    server.route({
      method: 'GET',
      path: '/route-limit',
      config: {
        plugins: {
          'hapi-rate-limitor': {
            max: 10,
            duration: 1000 * 60 // per minute
          }
        },
        handler: () => {
          return 'This is rate limitoooooooor!'
        }
      }
    })

    const request = {
      url: '/route-limit',
      method: 'GET'
    }

    const response = await server.inject(request)
    Expect(response.statusCode).to.equal(200)
    Expect(response.headers['x-rate-limit-limit']).to.equal(10)
    Expect(response.headers['x-rate-limit-remaining']).to.equal(9)
    Expect(response.headers['x-rate-limit-reset']).to.exist()
  })

  it('succeeds an authenticated request without route-specific rate limit and uses the route-limit, not user-limit', async () => {
    server.route({
      method: 'GET',
      path: '/route-limit-overrides-user-limit',
      config: {
        plugins: {
          'hapi-rate-limitor': {
            max: 10,
            duration: 60 * 1000 // 60s
          }
        },
        handler: () => {
          return 'This is rate limitoooooooor!'
        }
      }
    })

    const request = {
      url: '/route-limit-overrides-user-limit',
      method: 'GET',
      credentials: {
        name: 'Marcus'
      }
    }

    const response = await server.inject(request)
    Expect(response.statusCode).to.equal(200)
    Expect(response.headers['x-rate-limit-limit']).to.equal(10)
    Expect(response.headers['x-rate-limit-remaining']).to.equal(9)
    Expect(response.headers['x-rate-limit-reset']).to.exist()
  })
})
