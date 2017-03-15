'use strict';

const bot = require('../bot');
const Middleware = require('./Middleware');


/**
 * A middleware that caches a command result for a period of time.
 */
class CacheMiddleware extends Middleware {
    constructor(options) {
        super(options);
        this.order = 990;
    }

    get defaultOptions() {
        return {
            duration: 5 * 60
        };
    }

    onCommand(response) {
        const request = response.request;
        const id = this.getCacheIdFromParams(Object.values(request.params));
        return bot.cache.get(`${request.command}-exec`, id).then(cachedObj => {
            if (cachedObj) {
                response.reply = cachedObj;
            }
            return response;
        });
    }

    onReplyConstructed(response) {
        const request = response.request;
        const id = this.getCacheIdFromParams(Object.values(request.params));
        return bot.cache.set(`${request.command}-exec`, id, this.options.duration, response.reply).return(response);
    }

    getCacheIdFromParams(params) {
        return params.length > 0 ? params.join(' ') : '__noparams__';
    }
}

module.exports = CacheMiddleware;
