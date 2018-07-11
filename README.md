<p align="center">
  hapi-rate-limitor
</p>

<p align="center">
    <a href="https://travis-ci.org/fs-opensource/hapi-rate-limitor"><img src="https://camo.githubusercontent.com/9f56ef242c6f588f74f39f0bd61c1acd34d853af/68747470733a2f2f7472617669732d63692e6f72672f66732d6f70656e736f757263652f686170692d67656f2d6c6f636174652e7376673f6272616e63683d6d6173746572" alt="Build Status" data-canonical-src="https://travis-ci.org/fs-opensource/hapi-rate-limitor.svg?branch=master" style="max-width:100%;"></a>
    <a href="https://snyk.io/test/github/fs-opensource/hapi-rate-limitor"><img src="https://snyk.io/test/github/fs-opensource/hapi-rate-limitor/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/fs-opensource/hapi-rate-limitor" style="max-width:100%;"></a>
    <a href="https://www.npmjs.com/package/hapi-rate-limitor"><img src="https://img.shields.io/npm/v/hapi-rate-limitor.svg" alt="hapi-rate-limitor Version" data-canonical-src="https://img.shields.io/npm/v/hapi-rate-limitor.svg" style="max-width:100%;"></a>
</p>

------

<p align="center"><sup>The <a href="https://futurestud.io">Future Studio University</a> supports development of this hapi plugin 🚀</sup>
<br><b>
Join the <a href="https://futurestud.io/university">Future Studio University and Skyrocket in Node.js</a></b>
</p>

------

#### solid, easy to use rate limiting for hapi
<br>
<br>

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
The most straight forward to use `hapi-rate-limitor` is to register it to your hapi server. This will use the default configuration of [`async-ratelimiter`](https://github.com/microlinkhq/async-ratelimiter#api) and [ioredis](https://github.com/luin/ioredis/blob/master/API.md).

```js
await server.register({
  plugin: require('hapi-rate-limitor')
})

// went smooth like chocolate with default settings :)
```


## Plugin Options
Customize the plugin’s default configuration with the following options:

- **redis**: `(object)`, default: `null` — use the `redis` configuration to pass through your custom Redis configuration to `ioredis`

All other options are directly passed through to [`async-ratelimiter`](https://github.com/microlinkhq/async-ratelimiter#api).

```js
await server.register({
  plugin: require('hapi-rate-limitor'),
  options: {
    redis: {
      port: 6379,
      host: '127.0.0.1'
    },
    namespace: 'hapi-rate-limitor',
    max: 2, // a maximum of 2 requests
    duration: 1000 // per second (the value is in milliseconds)
  }
})

// went smooth like chocolate :)
```

Please check the [`async-ratelimiter API`](https://github.com/microlinkhq/async-ratelimiter#api) for all options.


## Feature Requests
Do you miss a feature? Please don’t hesitate to
[create an issue](https://github.com/fs-opensource/hapi-rate-limitor/issues) with a short description of your desired addition to this plugin.


## Links & Resources

- [hapi tutorial series](https://futurestud.io/tutorials/hapi-get-your-server-up-and-running) with 80+ tutorials


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
> GitHub [@fs-opensource](https://github.com/fs-opensource/) &nbsp;&middot;&nbsp;
> Twitter [@futurestud_io](https://twitter.com/futurestud_io)
