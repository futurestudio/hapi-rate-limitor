'use strict'

const Boom = require('boom')
const Redis = require('ioredis')
const RequestIp = require('request-ip')
const RateLimiter = require('async-ratelimiter')

/**
 * Extract the IP address from request.
 *
 * @param request
 *
 * @returns {String} - client request IP address
 */
function detectClientIP (request) {
  return RequestIp.getClientIp(request)
}

/**
 * Extract the rate-limit from user credentials
 * for authenticated requests. No return value
 * means the default limit is used.
 *
 * @param {Object} request
 * @param {String} userLimitKey
 *
 * @returns {Integer}
 */
function getRequestLimit (request, userLimitKey) {
  if (request.auth.credentials) {
    return request.auth.credentials[userLimitKey]
  }
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
    const requestLimit = getRequestLimit(request, options.userLimitKey)
    const clientIP = detectClientIP(request)

    const routeConfig = request.route.settings.plugins['hapi-rate-limitor'] || {}
    const config = Object.assign({ id: clientIP, max: requestLimit }, routeConfig)

    request.rateLimit = await rateLimiter.get(config)

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
  server.ext('onPreResponse', async request => {
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
