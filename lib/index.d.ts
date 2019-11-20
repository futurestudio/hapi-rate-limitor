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
         * This JWT secret key is used to sign a token for symmetric algorithms.
         * Symmetric algorithms (HMAC) start with "HS", like "HS256".
         * Ensure that the JWT secret has at least 32 characters.
         *
         * Symmetric algorithms:
         *   HS256, HS384, HS512
         *
         */
        secret?: string;
    }
}

declare var HapiRateLimitor: Plugin<HapiRateLimitor.Options>;

export = HapiRateLimitor;
