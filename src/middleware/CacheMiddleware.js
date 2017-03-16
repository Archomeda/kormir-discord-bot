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
            unique_params: true,
            unique_user: false,
            duration: 5 * 60
        };
    }

    onCommand(response) {
        const request = response.request;
        const id = this.getCacheId(request);
        return bot.cache.get(`${request.command}-exec`, id).then(cachedObj => {
            if (cachedObj) {
                response.reply = cachedObj;
            }
            return response;
        });
    }

    onReplyConstructed(response) {
        const request = response.request;
        const id = this.getCacheId(request);
        return bot.cache.set(`${request.command}-exec`, id, this.options.duration, response.reply).return(response);
    }

    getCacheId(request) {
        let id = '';
        if (this.options.unique_user) {
            id += request.message.author.id;
        }
        if (this.options.unique_params) {
            const params = Object.values(request.params);
            id += params.length > 0 ? params.join(' ') : '__noparams__';
        }
        return id;
    }
}

module.exports = CacheMiddleware;
