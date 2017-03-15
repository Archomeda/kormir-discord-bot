'use strict';

const ThrottleError = require('../errors/ThrottleError');
const bot = require('../bot');
const Middleware = require('./Middleware');


/**
 * A middleware that throttles commands on user or command-wide basis.
 */
class ThrottleMiddleware extends Middleware {
    get defaultOptions() {
        return {
            type: 'user',
            duration: 2
        };
    }

    onCommand(response) {
        const request = response.request;
        let throttleId;
        let throttleDescription;
        switch (this.options.type) {
            case 'user':
                throttleId = `user-${request.message.author.id}`;
                throttleDescription = 'User';
                break;
            case 'command':
                throttleId = `command-${request.command.id}`;
                throttleDescription = 'Command';
                break;
        }

        if (!throttleId) {
            return response;
        }

        return bot.cache.get('throttle', throttleId).then(cache => {
            if (cache) {
                // TODO: Improve logging texts in combination with tests
                throw new ThrottleError();
            }
            return bot.cache.set('throttle', throttleId, this.options.duration, {}).return(response);
        });
    }
}

module.exports = ThrottleMiddleware;
