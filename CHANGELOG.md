# Changelog

## [Unreleased]

### Updated
- tba.


## [2.0.1](https://github.com/fs-opensource/hapi-rate-limitor/compare/v2.0.0...v2.0.1) - 2018-09-11

### Updated
- fix 404 handling: proceed response without rate limit data


## [2.0.0](https://github.com/fs-opensource/hapi-rate-limitor/compare/v1.1.1...v2.0.0) - 2018-09-11

### Added
- route-specific rate limits
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
