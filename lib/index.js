'use strict'

const Boom = require('boom')
const Redis = require('ioredis')
const RequestIp = require('request-ip')
const RateLimiter = require('async-ratelimiter')

/**
 * Helper function to determine whether
 * it’s an authenticated request
 * containing user credentials.
 *
 * @param {Object} request
 */
function isAuthenticated (request) {
  return !!request.auth.credentials
}

/**
 * Helper function to determine whether
 * the authenticated request credentials
 * include the required keys.
 *
 * @param {Object} request
 * @param {String} idKey
 * @param {String} limitKey
 */
function hasProperties (request, idKey, limitKey) {
  return request.auth.credentials[idKey] && request.auth.credentials[limitKey]
}

/**
 * Check whether the credentials include
 * the rate limit key.
 *
 * @param {Object} request
 * @param {String} key
 */
function shouldLimitForUser (request, idKey, limitKey) {
  return isAuthenticated(request) && hasProperties(request, idKey, limitKey)
}

/**
 * Returns an object with the `id` and
 * `limit` properties that identify
 * the requests ID and limit.
 *
 * @param {Object} request
 * @param {String} userAttribute
 * @param {String} userLimitAttribute
 *
 * @returns {Object}
 */
function getFromRequest (request, userAttribute, userLimitAttribute) {
  if (shouldLimitForUser(request, userAttribute, userLimitAttribute)) {
    return {
      id: request.auth.credentials[userAttribute],
      limit: request.auth.credentials[userLimitAttribute]
    }
  }

  return {
    id: RequestIp.getClientIp(request),
    limit: undefined
  }
}

/**
 * The hapi plugin implementation
 */
async function register (server, options = {}) {
  const config = Object.assign({},
    {
      namespace: 'hapi-rate-limitor',
      db: new Redis(options.redis)
    },
    options
  )

  const rateLimiter = new RateLimiter(config)
  const { userAttribute = 'id', userLimitAttribute = 'rateLimit' } = options

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
    const { id, limit } = getFromRequest(request, userAttribute, userLimitAttribute)
    const routeConfig = request.route.settings.plugins['hapi-rate-limitor']

    const config = Object.assign({ max: limit }, routeConfig, { id })

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
