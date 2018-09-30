'use strict'

const Boom = require('boom')
const Redis = require('ioredis')
const RequestIp = require('request-ip')
const Limiter = require('async-ratelimiter')

class RateLimiter {
  /**
   * Create a new rate limiter instance.
   *
   * @param {Object} options
   */
  constructor (options) {
    const {
      view,
      max = 60,
      duration = 60 * 1000,
      userAttribute = 'id',
      userLimitAttribute = 'rateLimit',
      ...rateLimiterOptions
    } = options

    this.max = max
    this.view = view
    this.duration = duration
    this.userAttribute = userAttribute
    this.userLimitAttribute = userLimitAttribute
    this.limiter = this.createLimiter(rateLimiterOptions)
  }

  /**
   * Create a new async rate limiter instance from
   * the given user options. Defaults to 60
   * requests per minute.
   *
   * @param {Object} options
   *
   * @returns {Object}
   */
  createLimiter ({ redis, ...rest }) {
    const config = Object.assign({}, {
      namespace: 'hapi-rate-limitor',
      db: new Redis(redis),
      duration: this.duration,
      max: this.max
    }, rest)

    return new Limiter(config)
  }

  /**
   * Handle the incoming request and
   * check whether it exceeds the
   * rate limit.
   *
   * @param {Object} request
   * @param {Object} h
   *
   * @returns {Object}
   */
  async handle (request, h) {
    request.rateLimit = await this.from(request)

    if (request.rateLimit.remaining) {
      return h.continue
    }

    if (this.view) {
      return h.view(this.view, request.rateLimit).code(429).takeover()
    }

    throw Boom.tooManyRequests('You have exceeded the request limit')
  }

  /**
   * Determine the rate limit of
   * the given `request`.
   *
   * @param {Object} request
   *
   * @returns {Object}
   */
  async from (request) {
    const id = this.resolveRequestIdentifier(request)
    const routeConfig = request.route.settings.plugins['hapi-rate-limitor']

    if (routeConfig) {
      return this.limiter.get(Object.assign(routeConfig, { id }))
    }

    return this.limiter.get({ id, max: this.resolveMaxAttempts(request) })
  }

  /**
   * Resolves the request identifier. Returns the
   * user identifier for authenticated requests
   * and the IP address otherwise.
   *
   * @param {Object} request
   *
   * @returns {String}
   */
  resolveRequestIdentifier (request) {
    if (this.shouldLimitForUser(request)) {
      return request.auth.credentials[this.userAttribute]
    }

    return RequestIp.getClientIp(request)
  }

  /**
   * Returns the rate limit if the user is authenticated.
   * Unauthenticated requests fall back to the default
   * limit of the rate limiter.
   *
   * @param {Object} request
   *
   * @returns {Integer}
   */
  resolveMaxAttempts (request) {
    if (this.shouldLimitForUser(request)) {
      return request.auth.credentials[this.userLimitAttribute]
    }

    return this.max
  }

  /**
   * Check whether the credentials include
   * the rate limit key.
   *
   * @param {Object} request
   *
   * @returns {Boolean}
   */
  shouldLimitForUser (request) {
    return this.isAuthenticated(request) && this.hasProperties(request)
  }

  /**
   * Determine whether the request is authenticated.
   *
   * @param {Object} request
   *
   * @returns {Boolean}
   */
  isAuthenticated (request) {
    return !!request.auth.credentials
  }

  /**
 * Helper function to determine whether the authenticated
 * request credentials include the required keys.
 *
 * @param {Object} request
 *
 * @returns {Boolean}
 */
  hasProperties (request) {
    return request.auth.credentials[this.userAttribute] && request.auth.credentials[this.userLimitAttribute]
  }

  /**
   * Extend the response with rate limit headers.
   *
   * @param {Object} request
   * @param {Object} h
   *
   * @returns {Object}
   */
  async addHeaders (request, h) {
    if (!request.rateLimit) {
      return h.continue
    }

    return this.assignHeaders(request)
  }

  /**
   * Assign rate limit headers to
   * the response.
   *
   * @param {Object} request
   *
   * @returns {Object}
   */
  assignHeaders ({ rateLimit, response }) {
    const { total, remaining, reset } = rateLimit

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
  }
}

module.exports = RateLimiter
