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
        const params = Object.values(request.params);
        return bot.cache.get(`${request.command}-exec`, params.length > 0 ? params.join(' ') : '__noparams__')
            .then(cachedObj => {
                if (cachedObj) {
                    response.replyText = cachedObj;
                }
                return response;
            });
    }

    onResponse(response) {
        const request = response.request;
        const params = Object.values(request.params);
        return bot.cache.set(`${request.command}-exec`, params.length > 0 ? params.join(' ') : '__noparams__', this.options.duration, response.replyText)
            .return(response);
    }
}

module.exports = CacheMiddleware;
