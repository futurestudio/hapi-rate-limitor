'use strict'

class RateLimitEventEmitter {
  /**
   * Create a new instance for the given `emitter` and `server`.
   *
   * @param {EventEmitter} emitter
   * @param {Hapi.Server} server
   */
  constructor (emitter, server) {
    this.emitter = this.createEventEmitter(emitter, server)
  }

  /**
   * Returns an object of supported rate-limit events.
   *
   * @returns {Object}
   */
  get events () {
    return {
      attempt: 'rate-limit:attempt',
      inQuota: 'rate-limit:in-quota',
      exceeded: 'rate-limit:exceeded'
    }
  }

  /**
   * Use the given event `emitter` if available or fall
   * back to the hapi server as the event emitter.
   *
   * @param {EventEmitter} emitter
   * @param {Hapi.Server} server
   *
   * @returns {Object}
   */
  createEventEmitter (emitter, server) {
    if (emitter) {
      return emitter
    }

    Object
      .values(this.events)
      .forEach(name => server.event(name))

    return server.events
  }

  /**
   * Fire the rate limit “attempt” event.
   *
   * @param {Request} request
   */
  async fireAttemptEvent (request) {
    await this.emitter.emit(this.events.attempt, request)
  }

  /**
   * Fire the rate limit “in-quota” event.
   *
   * @param {Request} request
   */
  async fireInQuotaEvent (request) {
    await this.emitter.emit(this.events.inQuota, request)
  }

  /**
   * Fire the rate limit “exceeded” event.
   *
   * @param {Request} request
   */
  async fireExceededEvent (request) {
    await this.emitter.emit(this.events.exceeded, request)
  }
}

module.exports = RateLimitEventEmitter
