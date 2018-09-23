'use strict'

const RequestIp = require('request-ip')

class RateLimit {
  /**
   * Create a new rate limit instance that
   * determines the rate limit identifier
   * and actual limit.
   *
   * @param {Object} request
   * @param {String} userAttribute
   * @param {String} userLimitAttribute
   *
   * @returns {Object}
   */
  constructor (request, { idAttribute, limitAttribute }) {
    this.request = request
    this.userAttribute = idAttribute
    this.userLimitAttribute = limitAttribute

    this.routeConfig = this.request.route.settings.plugins['hapi-rate-limitor']

    return this.rateLimit()
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
  rateLimit () {
    const id = this.shouldLimitForUser() ? this.userId() : RequestIp.getClientIp(this.request)

    if (this.hasRouteConfig()) {
      return Object.assign(this.routeConfig, { id })
    }

    if (this.shouldLimitForUser()) {
      return { id, max: this.userLimit() }
    }

    return { id }
  }

  hasRouteConfig () {
    return !!this.routeConfig
  }

  /**
   * Check whether the credentials include
   * the rate limit key.
   *
   * @param {Object} request
   * @param {String} key
   *
   * @returns {Boolean}
   */
  shouldLimitForUser () {
    return this.isAuthenticated() && this.hasProperties()
  }

  /**
   * Helper function to determine whether
   * it’s an authenticated request
   * containing user credentials.
   *
   * @param {Object} request
   *
   * @returns {Boolean}
   */
  isAuthenticated () {
    return !!this.request.auth.credentials
  }

  /**
   * Helper function to determine whether
   * the authenticated request credentials
   * include the required keys.
   *
   * @param {Object} request
   * @param {String} idKey
   * @param {String} limitKey
   *
   * @returns {Boolean}
   */
  hasProperties () {
    return this.request.auth.credentials[this.userAttribute] && this.request.auth.credentials[this.userLimitAttribute]
  }

  /**
   * Returns the user identifier.
   *
   * @returns {String}
   */
  userId () {
    return this.request.auth.credentials[this.userAttribute]
  }

  /**
   * Returns the user limit.
   *
   * @returns {Integer}
   */
  userLimit () {
    return this.request.auth.credentials[this.userLimitAttribute]
  }
}

module.exports = RateLimit
