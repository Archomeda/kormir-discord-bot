'use strict';

const ThrottleError = require('../errors/ThrottleError');
const bot = require('../bot');
const Middleware = require('./Middleware');


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
        return bot.cache.get('throttle', request.message.author.id).then(cache => {
            if (cache) {
                throw new ThrottleError(`User has been throttled (user ${request.message.author.fullUsername}, command: ${request.command.trigger})`, 'log');
            }
            return bot.cache.set('throttle', request.message.author.id, this.options.duration, {}).return(response);
        });
    }
}

module.exports = UserThrottleMiddleware;
