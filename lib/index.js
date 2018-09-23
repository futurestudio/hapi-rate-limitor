'use strict'

const Boom = require('boom')
const RateLimiter = require('./limiter')

/**
 * The hapi plugin implementation
 */
async function register (server, options) {
  const rateLimiter = new RateLimiter(options)

  /**
   * Decorate the request with a `rateLimit` property.
   * This property stores the request’s rate limit
   * details for the response headers.
   */
  server.decorate('request', 'rateLimit', undefined)

  /**
   * Extend the request lifecylce and check whether
   * the request exceeds the rate limit.
   */
  server.ext('onPostAuth', async (request, h) => {
    request.rateLimit = await rateLimiter.fromRequest(request)

    if (!request.rateLimit.remaining) {
      throw Boom.tooManyRequests('You have exceeded the request limit')
    }

    return h.continue
  })

  /**
   * Extend response with rate-limit related headers
   * before sending the response. Append the headers
   * also on an error response.
   */
  server.ext('onPreResponse', async (request, h) => {
    if (!request.rateLimit) {
      return h.continue
    }

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
  once: true,
  pkg: require('../package.json')
}
