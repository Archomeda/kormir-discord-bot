'use strict';

const Promise = require('bluebird');

const Middleware = require('./Middleware');
const ThrottleError = require('./ThrottleError');


/**
 * A middleware that throttles messages.
 */
class ThrottleMiddleware extends Middleware {
    /**
     * Creates a new middleware that throttles messages.
     * @param {Bot} bot - The bot instance.
     * @param {DiscordCommand} command - The Discord command.
     * @param {Object.<string,*>} [options] - Additional options for the middleware.
     */
    constructor(bot, command, options) {
        super(bot, 'throttle', command, options);

        this._defaultOptions = {
            type: 'user',
            duration: this.getBot().getConfig().get('/discord.throttle', 2),
            removeDelay: 60
        };
    }

    onCommand(response) {
        const request = response.getRequest();
        const message = request.getMessage();
        return this.isCommandThrottled(request).then(isThrottled => {
            switch (isThrottled) {
                case 1:
                    // Throttled, but no warning sent yet
                    // By setting an explicit state, this will reset the timer; but this only happens once
                    return this.setThrottle(request, 2).then(() => {
                        if (message.deletable) {
                            return Promise.resolve(message.delete()).finally(() => {
                                throw new ThrottleError(request, true);
                            });
                        }
                        throw new ThrottleError(request, true);
                    });
                case 2:
                    // Throttled, warning already sent
                    if (message.deletable) {
                        return Promise.resolve(message.delete()).finally(() => {
                            throw new ThrottleError(request);
                        });
                    }
                    throw new ThrottleError(request);
                default:
                    // Not throttled
                    return this.setThrottle(request, 1);
            }
        }).return(response);
    }

    onReplyPosted(response, message) {
        if (!(response.getError() instanceof ThrottleError)) {
            return response;
        }

        const options = this.getOptions();
        if (!options.removeDelay || !message.deletable) {
            return response;
        }

        message.delete(options.removeDelay * 1000);
        return response;
    }

    /**
     * Checks if a command is currently throttled.
     * @param {DiscordCommandRequest} request - The request.
     * @returns {Promise<*>} The promise with the throttle state if throttled; undefined otherwise.
     */
    isCommandThrottled(request) {
        const id = this._getThrottleId(request);
        return this.getBot().getCache().get('throttle', id);
    }

    /**
     * Remembers the throttle.
     * @param {DiscordCommandRequest} request - The request.
     * @param {*} [state = {}] - The throttle state.
     * @returns {Promise<boolean>} The promise with true if successful; false otherwise.
     */
    setThrottle(request, state = {}) {
        const id = this._getThrottleId(request);
        return this.getBot().getCache().set('throttle', id, this.getOptions().duration, state);
    }

    /**
     * Gets the throttle id.
     * @param {DiscordCommandRequest} request - The request.
     * @returns {string} The throttle id.
     * @private
     */
    _getThrottleId(request) {
        switch (this.getOptions().type) {
            case 'command':
                return `command-${this.getCommand().getId()}`;
            case 'user':
            default:
                return `user-${request.getMessage().author.id}`;
        }
    }
}

module.exports = ThrottleMiddleware;
