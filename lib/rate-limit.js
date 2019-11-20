'use strict'

class RateLimit {
  /**
   * Creates a new rate limit instance based on the rate-limiting object provided from the
   * [async-ratelimiter](https://github.com/microlinkhq/async-ratelimiter) package.
   *
   * @returns {Number}
   */
  constructor (rateLimit) {
    this.rateLimit = rateLimit
  }

  /**
   * Returns the maximum allowed rate limit.
   *
   * @returns {Number}
   */
  get total () {
    return this.rateLimit.total
  }

  /**
   * Returns the remaining rate limit.
   *
   * @returns {Number}
   */
  get remaining () {
    return this.rateLimit.remaining - 1
  }

  /**
   * Returns the time since epoch in seconds when the rate limiting period will end.
   *
   * @returns {Number}
   */
  get reset () {
    return this.rateLimit.reset
  }

  /**
   * Determine whether the rate limit quota is exceeded (has no remaining).
   *
   * @returns {Boolean}
   */
  isInQuota () {
    return this.remaining >= 0
  }
}

module.exports = RateLimit
