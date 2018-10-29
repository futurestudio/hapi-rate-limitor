# Changelog


## [2.3.0](https://github.com/fs-opensource/hapi-rate-limitor/compare/v2.2.0...v2.3.0) - 2018-10-29

### Added
- `enabled` plugin option: allows you to disable the plugin, e.g. when running tests
- `enabled` route option: disable the plugin for individual routes that would eat up the user’s rate limit, e.g. assets

### Updated
- test for Node.js 11


## [2.2.0](https://github.com/fs-opensource/hapi-rate-limitor/compare/v2.1.0...v2.2.0) - 2018-10-21

### Updated
- extract ID from authenticated requests even without user limit
- extract user limit even without user identifier
- apply user’s max on routes with rate limit config
- bump dependencies


## [2.1.0](https://github.com/fs-opensource/hapi-rate-limitor/compare/v2.0.1...v2.1.0) - 2018-09-30

### Added
- [render a rate limit exceeded `view`](https://github.com/fs-opensource/hapi-rate-limitor#plugin-options)

### Updated
- refactoring: move rate limit handling to class
- fix lint issues in test files
- bump dependencies

### Deleted
- Travis testing for Node.js v9


## [2.0.1](https://github.com/fs-opensource/hapi-rate-limitor/compare/v2.0.0...v2.0.1) - 2018-09-11

### Updated
- fix 404 handling: proceed response without rate limit data


## [2.0.0](https://github.com/fs-opensource/hapi-rate-limitor/compare/v1.1.1...v2.0.0) - 2018-09-11

### Added
- [route-specific rate limits](https://github.com/fs-opensource/hapi-rate-limitor#route-options)
- NPM command to calculate coverage

### Updated
- fix user-specific rate limits and use the userId as identifier
- switch from `lab` and `code` to `AVA` for testing

### Deleted
- unused `.prettierignore` file

### Breaking Changes

- `userLimitKey` becomes `userLimitAttribute` in 2.0: if you used dynamic rate limits with `userLimitKey`, you need to change it to `userLimitAttribute`.


## [1.1.1](https://github.com/fs-opensource/hapi-rate-limitor/compare/v1.1.0...v1.1.1) - 2018-08-21

### Updated
- Readme: quick navigation and logo size fix for small screens


## [1.1.0](https://github.com/fs-opensource/hapi-rate-limitor/compare/v1.0.0...v1.1.0) - 2018-08-08

### Added
- [dynamic rate limits](https://github.com/fs-opensource/hapi-rate-limitor#dynamic-rate-limits)
- readme describes rate-limit-related response headers
- add logo


## 1.0.0 - 2018-07-11

### Added
- `1.0.0` release 🚀 🎉
