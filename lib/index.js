'use strict'

const RateLimiter = require('./rate-limiter')

/**
 * The hapi plugin implementation
 */
async function register (server, options) {
  /**
   * Create a rate limiter instance.
   */
  const limiter = new RateLimiter(options)

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
    return limiter.handle(request, h)
  })

  /**
   * Extend response with rate-limit related headers
   * before sending the response. Append the headers
   * also on an error response.
   */
  server.ext('onPreResponse', async (request, h) => {
    return limiter.addHeaders(request, h)
  })
}

exports.plugin = {
  register,
  once: true,
  pkg: require('../package.json')
}
