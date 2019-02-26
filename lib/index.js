'use strict'

const RateLimiter = require('./rate-limiter')

async function register (server, options) {
  const { enabled = true, extensionPoint = 'onPostAuth', ...config } = options

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

  server.ext(extensionPoint, async (request, h) => {
    return limiter.handle(request, h)
  })

  /**
   * Append rate-limit related headers to each
   * response, also to an error response.
   */
  server.ext('onPreResponse', (request, h) => {
    return limiter.addHeaders(request, h)
  })

  /**
   * Free Redis connection before exit
   */
  server.events.on('stop', async () => {
    await limiter.closeRedis()
  })
}

exports.plugin = {
  register,
  once: true,
  pkg: require('../package.json')
}
