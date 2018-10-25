'use strict'

const _ = require('lodash')
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
   * @param {Request} request
   * @param {ResponseToolkit} h
   *
   * @returns {Response}
   */
  async handle (request, h) {
    if (this.isDisabled(request)) {
      return h.continue
    }

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
   * Determines whether the rate limiter
   * is disabled for the given request.
   *
   * @param {Request} request
   *
   * @returns {Boolean}
   */
  isDisabled (request) {
    return !this.isEnabled(request)
  }

  /**
   * Determines whether the rate limiter
   * is enabled for the given request.
   *
   * @param {Request} request
   *
   * @returns {Boolean}
   */
  isEnabled (request) {
    const { enabled = true } = this.routeConfig(request)

    return enabled
  }

  /**
   * Returns the hapi-rate-limitor configuration
   * from the requested route route.
   *
   * @param {Request} request
   *
   * @returns {Object}
   */
  routeConfig (request) {
    return request.route.settings.plugins['hapi-rate-limitor'] || {}
  }

  /**
   * Determine the rate limit of
   * the given `request`.
   *
   * @param {Request} request
   *
   * @returns {Object} rate limit details
   */
  async from (request) {
    const id = this.resolveRequestIdentifier(request)
    const max = this.resolveMaxAttempts(request)

    const routeConfig = this.routeConfig(request)

    if (_.isEmpty(routeConfig)) {
      return this.limiter.get({ id, max })
    }

    return this.limiter.get(
      Object.assign({ max }, routeConfig, { id })
    )
  }

  /**
   * Resolves the request identifier. Returns the
   * user identifier for authenticated requests
   * and the IP address otherwise.
   *
   * @param {Request} request
   *
   * @returns {String}
   */
  resolveRequestIdentifier (request) {
    if (!this.isAuthenticated(request)) {
      return RequestIp.getClientIp(request)
    }

    if (!this.hasUserId(request)) {
      return RequestIp.getClientIp(request)
    }

    return this.userId(request)
  }

  /**
   * Returns the rate limit if the user is authenticated.
   * Unauthenticated requests fall back to the default
   * limit of the rate limiter.
   *
   * @param {Request} request
   *
   * @returns {Integer}
   */
  resolveMaxAttempts (request) {
    if (!this.isAuthenticated(request)) {
      return this.max
    }

    if (!this.hasUserLimit(request)) {
      return this.max
    }

    return this.userLimit(request)
  }

  /**
   * Determine whether the request is authenticated.
   *
   * @param {Request} request
   *
   * @returns {Boolean}
   */
  isAuthenticated (request) {
    return !!request.auth.credentials
  }

  /**
   * Returns true if the authenticated user
   * credentials include the property
   * to identify the user.
   *
   * @param {Request} request
   *
   * @returns {Boolean}
   */
  hasUserId (request) {
    return !!this.userId(request)
  }

  /**
   * Returns the user’s unique identifier
   * which is used as the rate limit id.
   *
   * @param {Request} request
   *
   * @returns {String}
   */
  userId (request) {
    return request.auth.credentials[this.userAttribute]
  }

  /**
   * Returns true if the authenticated user
   * credentials include the property
   * for a user limit.
   *
   * @param {Request} request
   *
   * @returns {Boolean}
   */
  hasUserLimit (request) {
    return !!this.userLimit(request)
  }

  /**
   * Returns the user’s rate limit.
   *
   * @param {Request} request
   *
   * @returns {Integer}
   */
  userLimit (request) {
    return request.auth.credentials[this.userLimitAttribute]
  }

  /**
   * Extend the response with rate limit headers.
   *
   * @param {Request} request
   * @param {ResponseTookit} h
   *
   * @returns {Response}
   */
  async addHeaders (request, h) {
    if (!request.rateLimit) {
      return h.continue
    }

    return this.assignHeaders(request)
  }

  /**
   * Assign rate limit response headers.
   *
   * @param {Request} request
   *
   * @returns {Response}
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
