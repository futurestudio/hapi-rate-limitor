<div align="center">
  <img src="https://github.com/futurestudio/hapi-rate-limitor/blob/master/media/hapi-rate-limitor.png?raw=true" alt="hapi-rate-limitor logo" width="471" style="max-width:100%;">
  <br/>
  <br/>

  <p>
    Solid and easy to use rate limiting for hapi.
  </p>
  <br/>
  <p>
    <a href="#installation"><strong>Installation</strong></a> ·
    <a href="#usage"><strong>Usage</strong></a> ·
    <a href="#plugin-options"><strong>Plugin Options</strong></a> ·
    <a href="#route-options"><strong>Route Options</strong></a> ·
    <a href="#response-headers"><strong>Response Headers</strong></a>
  </p>
  <br/>
  <br/>
  <p>
    <a href="https://travis-ci.org/futurestudio/hapi-rate-limitor"><img src="https://travis-ci.org/futurestudio/hapi-rate-limitor.svg?branch=master" alt="Build Status"></a>
    <a href="https://snyk.io/test/github/futurestudio/hapi-rate-limitor"><img src="https://snyk.io/test/github/futurestudio/hapi-rate-limitor/badge.svg" alt="Known Vulnerabilities"></a>
    <a href="https://www.npmjs.com/package/hapi-rate-limitor"><img src="https://img.shields.io/npm/v/hapi-rate-limitor.svg" alt="Latest Version"></a>
      <a href="https://www.npmjs.com/package/hapi-rate-limitor"><img src="https://img.shields.io/npm/dt/hapi-rate-limitor.svg" alt="Total downloads"></a>
    <a href="https://greenkeeper.io/" rel="nofollow"><img src="https://badges.greenkeeper.io/futurestudio/hapi-rate-limitor.svg" alt="Greenkeeper badge"></a>
  </p>
  <p>
    <em>Follow <a href="http://twitter.com/marcuspoehls">@marcuspoehls</a> for updates!</em>
  </p>
</div>

------

<p align="center"><sup>The <a href="https://futurestud.io">Future Studio University</a> supports development of this hapi plugin 🚀</sup>
<br><b>
Join the <a href="https://futurestud.io/university">Future Studio University and Skyrocket in Node.js</a></b>
</p>

------


## Introduction
A hapi plugin to prevent brute-force attacks in your app. The rate limiter uses [Redis](https://redis.io/) to store rate-limit related data.

`hapi-rate-limitor` is built on top of these solid and awesome projects:

- [async-ratelimiter](https://github.com/microlinkhq/async-ratelimiter)
- [ioredis](https://github.com/luin/ioredis)
- [request-ip](https://github.com/pbojinov/request-ip)

Each package solves its own problem perfectly. `hapi-rate-limitor` composes the solutions of each problem to a solid rate limit plugin for hapi.


## Requirements
> **hapi v17** and **Node.js v8 (or newer)**

This plugin requires **hapi v17** (or later) and uses async/await which requires **Node.js v8 or newer**.


## Installation
Add `hapi-rate-limitor` as a dependency to your project:

```bash
# NPM v5 users, this way is yours
npm i hapi-rate-limitor

# you’re using NPM v4:
npm i -S hapi-rate-limitor
```


## Usage
The most straight forward to use `hapi-rate-limitor` is to register it to your hapi server.

This will use the default configurations of [`async-ratelimiter`](https://github.com/microlinkhq/async-ratelimiter#api) and [ioredis](https://github.com/luin/ioredis/blob/master/API.md).

```js
await server.register({
  plugin: require('hapi-rate-limitor')
})

// went smooth like chocolate with default settings :)
```


## Plugin Options
Customize the plugin’s default configuration with the following options:

- **`redis`**: Object, default: `undefined`
  - use the `redis` configuration to pass through your custom Redis configuration to `ioredis`
- **`extensionPoint`**: String, default: `'onPostAuth'`
  - the [request lifecycle extension point](https://futurestud.io/downloads/hapi/request-lifecycle) for rate limiting
- **`userAttribute`**: String, default: `'id'`
  - credentials property that identifies a user/request on [dynamic rate limits](https://github.com/futurestudio/hapi-rate-limitor#dynamic-rate-limits). This option is used to access the value from `request.auth.credentials`.
- **`userLimitAttribute`**: String, default: `'rateLimit'`
  - define the property name that identifies the rate limit value on [dynamic rate limit](https://github.com/futurestudio/hapi-rate-limitor#dynamic-rate-limits). This option is used to access the value from `request.auth.credentials`.
- **`view`**: String, default: `undefined`
  - render the view instead of throwing an error (this uses `h.view(yourView, { total, remaining, reset }).code(429)`)
- **`enabled`**: Boolean, default: `true`
  - enabled or disable the plugin, e.g. when running tests
- **`skip`**: Function, default: `() => false`
  - an async function to determine whether to skip rate limiting for a given request. The `skip` function accepts the incoming request as the only argument

All other options are directly passed through to [async-ratelimiter](https://github.com/microlinkhq/async-ratelimiter#api).

```js
await server.register({
  plugin: require('hapi-rate-limitor'),
  options: {
    redis: {
      port: 6379,
      host: '127.0.0.1'
    },
    extensionPoint: 'onPreAuth',
    namespace: 'hapi-rate-limitor',
    max: 2,                                     // a maximum of 2 requests
    duration: 1000                              // per second (the value is in milliseconds),
    userAttribute: 'id',
    userLimitAttribute: 'rateLimit',
    view: 'rate-limit-exceeded',                // render this view when the rate limit exceeded
    enabled: true
    skip: async (request) => {
      return request.path.includes('/admin')    // example: disable rate limiting for the admin panel
    }
  }
})

// went smooth like chocolate :)
```

Please check the [async-ratelimiter API](https://github.com/microlinkhq/async-ratelimiter#api) for all options.


## Route Options
Customize the plugin’s default configuration on routes. A use case for this is a login route where you want to reduce the request limit even lower than the default limit.

On routes, `hapi-rate-limitor` respects all options related to rate limiting. Precisely, all options that [async-ratelimiter](https://github.com/microlinkhq/async-ratelimiter#api) supports. It does not accept Redis connection options or identifiers for dynamic rate limiting.

All other options are directly passed through to [async-ratelimiter](https://github.com/microlinkhq/async-ratelimiter#api).

```js
await server.register({
  plugin: require('hapi-rate-limitor'),
  options: {
    redis: {
      port: 6379,
      host: '127.0.0.1'
    },
    namespace: 'hapi-rate-limitor',
    max: 60,             // a maximum of 60 requests
    duration: 60 * 1000, // per minute (the value is in milliseconds)
  }
})

await server.route({
  method: 'POST',
  path: '/login',
  options: {
    handler: () {
      // do the login handling
    },
    plugins: {
      'hapi-rate-limitor': {
        max: 5,              // a maximum of 5 requests
        duration: 60 * 1000, // per minute
        enabled: false       // but it’s actually not enabled ;-)
      }
    }
  }
})

// went smooth like chocolate :)
```

Please check the [async-ratelimiter API](https://github.com/microlinkhq/async-ratelimiter#api) for all options.


## Dynamic Rate Limits
To make use of user-specific rate limits, you need to configure the `userIdKey` and `userLimitKey` attributes in the `hapi-rate-limitor` options. These attributes are used to determine the rate limit properties. The `userIdKey` is the property name that uniquely identifies a user. The `userLimitKey` is the property name that contains the rate limit value.

```js
await server.register({
  plugin: require('hapi-rate-limitor'),
  options: {
    userLimitId: 'id',
    userLimitKey: 'rateLimit',
    max: 500,                // a maximum of 500 requests (default is 2500)
    duration: 60 * 60 * 1000 // per hour (the value is in milliseconds)
    // other plugin options
  }
})
```

This will calculate the maximum requests individually for each authenticated user based on the user’s `id` and `'rateLimit'` attributes. Imagine the following user object as an authenticated user:

```js
/**
 * the authenticated user object may contain
 * a custom rate limit attribute. In this
 * case, it’s called "rateLimit".
 */
request.auth.credentials = {
  id: 'custom-uuid',
  rateLimit: 1750,
  name: 'Marcus'
  // ... further attributes
}
```

For this specific user, the maximum amount of requests is `1750` per hour (and not the plugin’s default `500`).

`hapi-rate-limitor` uses the plugin’s limit if the request is unauthenticated or `request.auth.credentials` doesn’t contain a rate-limit-related attribute.


## Response Headers
The plugin sets the following response headers:

- `X-Rate-Limit-Limit`: total request limit (`max`) within `duration`
- `X-Rate-Limit-Remaining`: remaining quota until reset
- `X-Rate-Limit-Reset`: time since epoch in seconds that the rate limiting period will end


## Feature Requests
Do you miss a feature? Please don’t hesitate to
[create an issue](https://github.com/futurestudio/hapi-rate-limitor/issues) with a short description of your desired addition to this plugin.


## Links & Resources

- [hapi tutorial series](https://futurestud.io/tutorials/hapi-get-your-server-up-and-running) with 100+ tutorials


## Contributing

1.  Create a fork
2.  Create your feature branch: `git checkout -b my-feature`
3.  Commit your changes: `git commit -am 'Add some feature'`
4.  Push to the branch: `git push origin my-new-feature`
5.  Submit a pull request 🚀


## License

MIT © [Future Studio](https://futurestud.io)

---

> [futurestud.io](https://futurestud.io) &nbsp;&middot;&nbsp;
> GitHub [@futurestudio](https://github.com/futurestudio/) &nbsp;&middot;&nbsp;
> Twitter [@futurestud_io](https://twitter.com/futurestud_io)
