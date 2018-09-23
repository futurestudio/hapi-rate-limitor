'use strict'

const Redis = require('ioredis')
const RateLimiter = require('async-ratelimiter')
const RateLimitConfig = require('./rate-limit-config')

class Limiter {
  constructor (options) {
    const { redis, userAttribute, userLimitAttribute, ...rest } = options

    const config = Object.assign({},
      {
        namespace: 'hapi-rate-limitor',
        db: new Redis(redis)
      },
      rest
    )

    this.rateLimiter = new RateLimiter(config)
    this.rateLimitConfig = {
      idAttribute: userAttribute || 'id',
      limitAttribute: userLimitAttribute || 'rateLimit'
    }
  }

  async fromRequest (request) {
    const config = new RateLimitConfig(request, this.rateLimitConfig)

    return this.rateLimiter.get(config)
  }
}

module.exports = Limiter
