'use strict'

const Boom = require('boom')
const Redis = require('ioredis')
const RequestIp = require('request-ip')
const RateLimiter = require('async-ratelimiter')

/**
 * Extract the IP address from request
 *
 * @param request
 *
 * @returns {String} - client request IP address
 */
function detectClientIP (request) {
  return RequestIp.getClientIp(request)
}

/**
 * The hapi plugin implementation
 */
async function register (server, options) {
  const config = Object.assign({},
    {
      namespace: 'hapi-rate-limitor',
      db: new Redis(options.redis)
    },
    options
  )

  const rateLimiter = new RateLimiter(config)

  /**
   * decorate the request with a `rateLimit` property;
   * this property stores the request’s rate limit details
   */
  server.decorate('request', 'rateLimit', undefined)

  /**
   * check if requesting IP address exceeds the rate limit
   */
  server.ext('onRequest', async (request, h) => {
    const clientIp = detectClientIP(request)

    request.rateLimit = await rateLimiter.get({ id: clientIp })

    if (!request.rateLimit.remaining) {
      throw Boom.tooManyRequests('You have exceeded the request limit')
    }

    return h.continue
  })

  /**
   * append rate-limit-related response headers
   */
  server.ext('onPreResponse', async (request, h) => {
    const { total, remaining, reset } = request.rateLimit
    const response = request.response

    if (response.isBoom) {
      response.output.headers['X-Rate-Limit-Limit'] = total
      response.output.headers['X-Rate-Limit-Remaining'] = Math.max(0, remaining - 1)
      response.output.headers['X-Rate-Limit-Reset'] = reset

      return response
    }

    return response
      .header('X-Rate-Limit-Limit', total)
      .header('X-Rate-Limit-Remaining', Math.max(0, remaining - 1))
      .header('X-Rate-Limit-Reset', reset)
  })
}

exports.plugin = {
  register,
  pkg: require('../package.json'),
  once: true
}
