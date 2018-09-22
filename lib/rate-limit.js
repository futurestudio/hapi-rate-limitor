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
  constructor (request, userAttribute, userLimitAttribute) {
    this.request = request
    this.userAttribute = userAttribute
    this.userLimitAttribute = userLimitAttribute

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
    if (this.shouldLimitForUser()) {
      return {
        id: this.userId(),
        limit: this.userLimit()
      }
    }

    return {
      id: RequestIp.getClientIp(this.request)
    }
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
}

module.exports = RateLimit
