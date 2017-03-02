'use strict';

const bot = require('../bot');
const Middleware = require('./Middleware');


class CacheMiddleware extends Middleware {
    constructor(options) {
        super(options);
        this.order = 990;
        const defaultOptions = {
            duration: 5 * 60
        };
        this.options = Object.assign({}, defaultOptions, options);
    }

    onCommand(response) {
        const request = response.request;
        const id = this.getCacheIdFromParams(Object.values(request.params));
        return bot.cache.get(`${request.command}-exec`, id)
            .then(cachedObj => {
                if (cachedObj) {
                    response.replyText = cachedObj;
                }
                return response;
            });
    }

    onResponse(response) {
        const request = response.request;
        const id = this.getCacheIdFromParams(Object.values(request.params));
        return bot.cache.set(`${request.command}-exec`, id, this.options.duration, response.replyText).return(response);
    }

    getCacheIdFromParams(params) {
        return params.length > 0 ? params.join(' ') : '__noparams__';
    }
}

module.exports = CacheMiddleware;
