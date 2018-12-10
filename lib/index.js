'use strict'

const RateLimiter = require('./rate-limiter')

async function register (server, options) {
  const { enabled = true, ...config } = options

  /**
   * Cut early if rate limiting is disabled.
   */
  if (!enabled) {
    return
  }

  /**
   * This property stores the request’s rate limit
   * details for the response headers.
   */
  server.decorate('request', 'rateLimit')

  const limiter = new RateLimiter(config)

  server.ext('onPostAuth', async (request, h) => {
    return limiter.handle(request, h)
  })

  /**
   * Extend response with rate-limit related headers
   * before sending the response. Append the headers
   * also on an error response.
   */
  server.ext('onPreResponse', (request, h) => {
    return limiter.addHeaders(request, h)
  })
}

exports.plugin = {
  register,
  once: true,
  pkg: require('../package.json')
}
