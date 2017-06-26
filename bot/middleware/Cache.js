'use strict';

const Middleware = require('./Middleware');


/**
 * A middleware that caches a command result for a period of time.
 */
class CacheMiddleware extends Middleware {
    /**
     * Creates a new middleware that caches a command result.
     * @param {Bot} bot - The bot instance.
     * @param {DiscordCommand} command - The Discord command.
     * @param {Object.<string,*>} [options] - Additional options for the middleware.
     */
    constructor(bot, command, options) {
        super(bot, 'cache', command, options);

        this._defaultOptions = {
            order: 990,
            uniqueParams: true,
            uniqueUser: false,
            duration: 5 * 60
        };
    }

    onCommand(response) {
        const bot = this.getBot();
        const request = response.getRequest();
        const command = request.getRawCommand();
        const id = this.getCacheId(request);

        return bot.getCache().get(`${command}-exec`, id).then(cachedObj => {
            if (cachedObj) {
                response.reply = cachedObj;
            }
            return response;
        });
    }

    onReplyConstructed(response) {
        const bot = this.getBot();
        const request = response.getRequest();
        const command = request.getRawCommand();
        const options = this.getOptions();
        const id = this.getCacheId(request);

        return bot.getCache().get(`${command}-exec`, id).then(cachedObj => {
            if (!cachedObj) {
                return bot.getCache().set(`${command}-exec`, id, options.duration, response.reply);
            }
        }).return(response);
    }

    getCacheId(request) {
        const options = this.getOptions();
        let id = '';
        if (options.uniqueUser) {
            id += request.getMessage().author.id;
        }
        if (options.uniqueParams) {
            const params = request.getRawParams();
            id += params ? params.replace(/\s/g, '_') : '__noparams__';
        }
        return id;
    }
}

module.exports = CacheMiddleware;
