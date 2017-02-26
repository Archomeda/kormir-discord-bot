'use strict';

const
    Middleware = require('./Middleware'),
    ThrottleError = require('../errors/ThrottleError');

class UserThrottleMiddleware extends Middleware {
    constructor(options) {
        super(options);
        const defaultOptions = {
            duration: 2
        };
        this.options = Object.assign({}, defaultOptions, options);
    }

    onCommand(response) {
        const request = response.request;
        return request.module.bot.cache.get('throttle', request.message.author.id).then(cache => {
            if (cache) {
                throw new ThrottleError(`User has been throttled (user ${request.message.author.fullUsername}, command: ${request.command.trigger})`, 'log');
            }
            return request.module.bot.cache.set('throttle', request.message.author.id, this.options.duration, {}).return(response);
        });
    }
}

module.exports = UserThrottleMiddleware;
