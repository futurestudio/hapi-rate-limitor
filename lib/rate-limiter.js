'use strict'

const Redis = require('ioredis')
const Boom = require('@hapi/boom')
const RateLimit = require('./rate-limit')
const Limiter = require('async-ratelimiter')
const RequestIp = require('@supercharge/request-ip')
const RateLimitEventEmitter = require('./event-emitter')

class RateLimiter extends RateLimitEventEmitter {
  /**
   * Create a new rate limiter instance.
   */
  constructor (server, options = {}) {
    const {
      view,
      getIp,
      emitter,
      max = 60,
      redis = {},
      ipWhitelist = [],
      skip = () => false,
      duration = 60 * 1000,
      userAttribute = 'id',
      userLimitAttribute = 'rateLimit',
      ...rateLimiterOptions
    } = options

    super(emitter, server)

    this.max = max
    this.view = view
    this.skip = skip
    this.getIp = getIp
    this.server = server
    this.duration = duration
    this.userAttribute = userAttribute
    this.redis = this.createRedis(redis)
    this.ipWhitelist = [].concat(ipWhitelist)
    this.userLimitAttribute = userLimitAttribute
    this.limiter = this.createLimiter(rateLimiterOptions)
  }

  /**
   * Create a Redis instance.
   *
   * @param {Object} config
   *
   * @returns {Redis}
   */
  createRedis (config) {
    if (typeof config === 'string') {
      return new Redis(config, { lazyConnect: true })
    }

    if (typeof config === 'object') {
      return new Redis(
        Object.assign(config, { lazyConnect: true })
      )
    }

    throw new Error('Invalid Redis connection details. Valid connection details are a connection string or an ioredis-compatible object.')
  }

  /**
   * Start the rate limitor and
   * connect to Redis.
   */
  async start () {
    await this.ensureCustomViewExists()
    await this.connectRedis()
  }

  /**
   * Stop the rate limitor and close
   * the Redis connection.
   */
  async stop () {
    await this.disconnectRedis()
  }

  /**
   * Ensure that the user-defined view
   * exists, throw otherwise.
   *
   * @throws
   */
  async ensureCustomViewExists () {
    if (this.hasView()) {
      try {
        await this.server.render(this.view)
      } catch (ignoreErr) {
        throw new Error(`Cannot find your view file: ${this.view}. Please check the view path.`)
      }
    }
  }

  /**
   * Create a Redis connection.
   */
  async connectRedis () {
    await this.redis.connect()
  }

  /**
   * Close the Redis connection.
   */
  async disconnectRedis () {
    await this.redis.quit()
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
  createLimiter (options) {
    const config = Object.assign({
      namespace: 'hapi-rate-limitor',
      db: this.redis,
      duration: this.duration,
      max: this.max
    }, options)

    return new Limiter(config)
  }

  /**
   * Rate-limit the incoming request. Proceed the request
   * lifecycle if the limit is in quote, create an
   * “rate limit exceeded” response otherwise.
   *
   * @param {Request} request
   * @param {Toolkit} h
   *
   * @returns {Response}
   */
  async handle (request, h) {
    if (await this.shouldSkip(request)) {
      return h.continue
    }

    request.rateLimit = await this.rateLimit(request)

    return request.rateLimit.isInQuota()
      ? this.proceed(request, h)
      : this.handleExceeded(request, h)
  }

  /**
   * Fire the “in quota” event and continue the request lifecycle.
   *
   * @param {Request} request
   * @param {Toolkit} h
   *
   * @returns {Symbol} continue symbol
   */
  async proceed (request, h) {
    await this.fireInQuotaEvent(request)

    return h.continue
  }

  /**
   * Fire the “exceeded” event and create and error response.
   * The response is either a view or a boom error.
   *
   * @param {Request} request
   * @param {Toolkit} h
   *
   * @returns {*}
   */
  async handleExceeded (request, h) {
    await this.fireExceededEvent(request)

    if (this.hasView()) {
      return h.view(this.view, request.rateLimit).code(429).takeover()
    }

    throw Boom.tooManyRequests('You have exceeded the request limit')
  }

  /**
   * Determines whether to skip rate limiting
   * for the given `request`.
   *
   * @param {Request} request
   *
   * @returns {Boolean}
   */
  async shouldSkip (request) {
    return this.isDisabledFor(request) || await this.hasWhitelistedIp(request) || this.skip(request)
  }

  /**
   * Determines whether the rate limiter
   * is disabled for the given request.
   *
   * @param {Request} request
   *
   * @returns {Boolean}
   */
  isDisabledFor (request) {
    return !this.isEnabledFor(request)
  }

  /**
   * Determines whether the rate limiter
   * is enabled for the given request.
   *
   * @param {Request} request
   *
   * @returns {Boolean}
   */
  isEnabledFor (request) {
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
   * Determine whether the given `request` has a route-level configuration
   * for the max number of requests against this endpoint.
   *
   * @param {Request} request
   *
   * @returns {Boolean}
   */
  hasMaxAttemptsInRouteConfig (request) {
    const { max } = this.routeConfig(request)

    return !!max
  }

  /**
   * Returns `true` if the requesting IP is on the whitelist.
   *
   * @param {Request} request
   *
   * @returns {Boolean}
   */
  async hasWhitelistedIp (request) {
    return this.ipWhitelist.includes(
      await this.ip(request)
    )
  }

  /**
   * Determine the rate limit of the given `request`. Fires
   * the “attempt” event before rate-limiting the request.
   *
   * @param {Request} request
   *
   * @returns {RateLimit} rate limit instance
   */
  async rateLimit (request) {
    await this.fireAttemptEvent(request)

    const config = await this.rateLimitConfigFor(request)

    return new RateLimit(
      await this.limiter.get(config)
    )
  }

  /**
   * Returns the configuration used to determine the rate limit for the given `request`.
   *
   * @param {Request} request
   *
   * @returns {Object}
   */
  async rateLimitConfigFor (request) {
    const max = this.resolveMaxAttempts(request)
    const routeConfig = this.routeConfig(request)

    return { max, ...routeConfig, id: await this.requestIdentifier(request) }
  }

  /**
   * Resolve the request identifier used to rate-limit the given `request`.
   *
   * @param {Request} request
   *
   * @returns {String}
   */
  async requestIdentifier (request) {
    return this.hasMaxAttemptsInRouteConfig(request)
      ? this.resolveRequestIdentifierForRoute(request)
      : this.resolveRequestIdentifier(request)
  }

  /**
   * Returns the request identifier for the route belonging to the given `request`.
   *
   * @param {Request} request
   *
   * @returns {String}
   */
  async resolveRequestIdentifierForRoute (request) {
    return this.routeIdentifier(request)
      .concat(':')
      .concat(
        await this.resolveRequestIdentifier(request)
      )
  }

  /**
   * Returns the route-specific identifier for the given `request`.
   * The request’s path is used to identify the route.
   *
   * @param {Request} request
   *
   * @returns {String}
   */
  routeIdentifier (request) {
    return String(request.path)
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
  async resolveRequestIdentifier (request) {
    if (!this.isAuthenticated(request)) {
      return this.ip(request)
    }

    if (!this.hasUserId(request)) {
      return this.ip(request)
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
   * Determine whether to render a custom
   * “rate limit exceeded” view.
   *
   * @returns {Boolean}
   */
  hasView () {
    return !!this.view
  }

  /**
   * Returns the requesting client’s IP address.
   *
   * @param {Request} request
   *
   * @returns {String}
   */
  async ip (request) {
    return this.getIp
      ? this.getIp(request)
      : RequestIp.getClientIp(request)
  }

  /**
   * Extend the response with rate limit headers.
   *
   * @param {Request} request
   * @param {ResponseTookit} h
   *
   * @returns {Response}
   */
  addHeaders (request, h) {
    return request.rateLimit
      ? this.assignHeaders(request)
      : h.continue
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
      response.output.headers['X-Rate-Limit-Remaining'] = Math.max(0, remaining)
      response.output.headers['X-Rate-Limit-Reset'] = reset

      return response
    }

    return response
      .header('X-Rate-Limit-Limit', total)
      .header('X-Rate-Limit-Remaining', Math.max(0, remaining))
      .header('X-Rate-Limit-Reset', reset)
  }
}

module.exports = RateLimiter
