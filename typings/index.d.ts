/// <reference types='node' />

import { Plugin, Request } from '@hapi/hapi';


declare module '@hapi/hapi' {
    interface Request {
        rateLimit: HapiRateLimitor.RateLimit;
    }
}


declare namespace HapiRateLimitor {
    interface RateLimit {
        /**
         * Returns the maximum allowed rate limit.
         *
         * @returns Returns the maximum allowed rate limit.
         */
        total: number;

        /**
         * Returns the remaining rate limit.
         *
         * @returns Returns the remaining rate limit.
         */
        remaining: number;

        /**
         * Returns the time since epoch in seconds when the rate limiting period will end.
         *
         * @returns Returns the time since epoch in seconds when the rate limiting period will end.
         */
        reset: number;

        /**
         * Determine whether the rate limit quota is exceeded (has no remaining).
         *
         * @returns Returns `true` if the rate limit is not exceeded, otherwise `false`.
         */
        isInQuota(): boolean;
    }


    /**
     * Available options when registering hapi-rate-limitor as a plugin to the hapi server.
     */
    interface Options {
        /**
         * The maximum number of requests allowed in a `duration`.
         *
         */
        max?: number;

        /**
         * The lifetime window keeping records of a request in milliseconds.
         *
         */
        duration?: number;

        /**
         * The used prefix to create the rate limit identifier before storing the data.
         *
         */
        namespace?: string;

        /**
         * The Redis configuration used to create and connect an ioRedis instance.
         * The configuration value can be a connection string or an object.
         * This property is passed through to ioRedis.
         *
         */
        redis?: string | object;

        /**
         * The [request lifecycle extension point](https://futurestud.io/downloads/hapi/request-lifecycle) used for rate limiting
         *
         */
        extensionPoint?: string;

        /**
         * the property name identifying a user (credentials) for dynamic rate limits (see Readme).
         * This option is used to access the value from `request.auth.credentials`.
         *
         */
        userAttribute?: string;

        /**
         * The property name identifying the rate limit value on dynamic rate limit (see Readme).
         * This option is used to access the value from `request.auth.credentials`.
         *
         */
        userLimitAttribute?: string;

        /**
         * The path to a view file which will be rendered instead of throwing an error.
         * The rate limiter uses `h.view(yourView, { total, remaining, reset }).code(429)`
         * to render the defined view.
         *
         */
        view?: string;

        /**
         * A shortcut to enable or disable the plugin, e.g. when running tests.
         *
         */
        enabled?: boolean;

        /**
         * An async function with the signature `async (request)` to determine whether
         * to skip rate limiting for a given request. The `skip` function retrieves
         * the incoming request as the only argument.
         *
         */
        skip?(request: Request): Promise<boolean>;

        /**
         * An array of whitelisted IP addresses that won’t be rate-limited. Requests from
         * such IPs proceed the request lifecycle. Notice that the related responses
         * won’t contain rate limit headers.
         *
         */
        ipWhitelist?: Array<string>;

        /**
         * An async function with the signature `async (request)` to manually determine
         * the requesting IP address. This is helpful if your load balancer provides
         * the client IP address as the last item in the list of forwarded
         * addresses (e.g. Heroku and AWS ELB).
         *
         */
        getIp?(request: Request): Promise<string>;

        /**
         * an event emitter instance used to emit the
         * [rate-limitting events](https://github.com/futurestudio/hapi-rate-limitor#events)
         *
         */
        emitter?: object;
    }
}

declare var HapiRateLimitor: Plugin<HapiRateLimitor.Options>;

export = HapiRateLimitor;
