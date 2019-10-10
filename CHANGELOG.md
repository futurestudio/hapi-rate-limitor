# Changelog


## [2.10.0](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.9.0...v2.10.0) - 2019-10-10

### Added
- `getIp` option allowing you to manually determine the IP address from the request.
  - Example:
    ```js
      getIp: async (request) => {
        const ips = request.headers['x-forwarded-for'].split(',')

        return ips[ips.length - 1]
      },
    ```
- `emitter` option to pass in your custom event emitter
- dispatch rate limiting events: `rate-limit:attempt`, `rate-limit:in-quota`, `rate-limit:exceeded`
  - every event listener receives the request as the only argument


## [2.9.0](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.8.0...v2.9.0) - 2019-08-13

### Added
- add `ipWhitelist` option representing an array of IP addresses that will skip rate limiting

### Updated
- bump dependencies
- update NPM scripts
- minor code refinements

### Removed
- Travis testing for Node.js version 11


## [2.8.0](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.7.1...v2.8.0) - 2019-06-25

### Added
- support for Redis connection string, like `redis: 'redis://user:pass@dokku-redis-lolipop:6379'` (Thank you Rob! [PR #37](https://github.com/futurestudio/hapi-rate-limitor/pull/37))

### Updated
- minor code refinements
- bump dependencies


## [2.7.1](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.7.0...v2.7.1) - 2019-05-10

### Updated
- update to `@hapi/boom` from `boom`
- test Node.js v12
- bump dependencies


## [2.7.0](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.6.1...v2.7.0) - 2019-05-04

### Added
- ensure a user-defined view exists on server start, otherwise throw an error

### Updated
- bump dependencies
- minor internal refactorings


## [2.6.1](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.6.0...v2.6.1) - 2019-04-27

### Updated
- bump dependencis
- update to hapi scoped dependencies


## [2.6.0](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.5.3...v2.6.0) - 2019-02-28

### Added
- wait for Redis connection `onPreStart`
- close Redis connection `onPostStop`


## [2.5.3](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.5.2...v2.5.3) - 2019-02-18

### Updated
- bump dependencies
- fix badges in Readme
- Changelog: rename GitHub references `fs-opensource -> futurestudio`


## [2.5.2](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.5.1...v2.5.2) - 2019-01-26

### Updated
- Readme: rename GitHub references `fs-opensource -> futurestudio`


## [2.5.1](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.5.0...v2.5.1) - 2019-01-22

### Updated
- update tests for hapi 18
- bump dependencies


## [2.5.0](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.4.0...v2.5.0) - 2019-01-16

### Added
- plugin option `skip`: a function that determines whether to skip rate limiting for a request

### Updated
- bump dependencies


## [2.4.0](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.3.0...v2.4.0) - 2018-12-12

### Added
- plugin option `extensionPoint`: [request lifecycle extension point](https://futurestud.io/downloads/hapi/request-lifecycle) when the plugin should apply rate limiting

### Updated
- bump dependencies
- refined plugin options overview in Readme
- improved formatting of code examples in Readme


## [2.3.0](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.2.0...v2.3.0) - 2018-10-29

### Added
- `enabled` plugin option: allows you to disable the plugin, e.g. when running tests
- `enabled` route option: disable the plugin for individual routes that would eat up the user’s rate limit, e.g. assets

### Updated
- test for Node.js 11


## [2.2.0](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.1.0...v2.2.0) - 2018-10-21

### Updated
- extract ID from authenticated requests even without user limit
- extract user limit even without user identifier
- apply user’s max on routes with rate limit config
- bump dependencies


## [2.1.0](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.0.1...v2.1.0) - 2018-09-30

### Added
- [render a rate limit exceeded `view`](https://github.com/futurestudio/hapi-rate-limitor#plugin-options)

### Updated
- refactoring: move rate limit handling to class
- fix lint issues in test files
- bump dependencies

### Deleted
- Travis testing for Node.js v9


## [2.0.1](https://github.com/futurestudio/hapi-rate-limitor/compare/v2.0.0...v2.0.1) - 2018-09-11

### Updated
- fix 404 handling: proceed response without rate limit data


## [2.0.0](https://github.com/futurestudio/hapi-rate-limitor/compare/v1.1.1...v2.0.0) - 2018-09-11

### Added
- [route-specific rate limits](https://github.com/futurestudio/hapi-rate-limitor#route-options)
- NPM command to calculate coverage

### Updated
- fix user-specific rate limits and use the userId as identifier
- switch from `lab` and `code` to `AVA` for testing

### Deleted
- unused `.prettierignore` file

### Breaking Changes

- `userLimitKey` becomes `userLimitAttribute` in 2.0: if you used dynamic rate limits with `userLimitKey`, you need to change it to `userLimitAttribute`.


## [1.1.1](https://github.com/futurestudio/hapi-rate-limitor/compare/v1.1.0...v1.1.1) - 2018-08-21

### Updated
- Readme: quick navigation and logo size fix for small screens


## [1.1.0](https://github.com/futurestudio/hapi-rate-limitor/compare/v1.0.0...v1.1.0) - 2018-08-08

### Added
- [dynamic rate limits](https://github.com/futurestudio/hapi-rate-limitor#dynamic-rate-limits)
- readme describes rate-limit-related response headers
- add logo


## 1.0.0 - 2018-07-11

### Added
- `1.0.0` release 🚀 🎉
