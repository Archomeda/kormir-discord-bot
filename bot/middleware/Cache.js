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
     * @param {Object<string, *>} [options] - Additional options for the middleware.
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


    /**
     * Gets the cache id.
     * @param {DiscordCommandRequest} request - The request.
     * @returns {string} The cache id.
     * @private
     */
    _getCacheId(request) {
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


    async onCommand(response) {
        const bot = this.getBot();
        const request = response.getRequest();
        const command = request.getRawCommand();
        const id = this._getCacheId(request);

        const cachedObj = await bot.getCache().get(`${command}-exec`, id);
        if (cachedObj) {
            response.reply = cachedObj;
        }
        return response;
    }

    async onReplyConstructed(response) {
        const bot = this.getBot();
        const request = response.getRequest();
        const command = request.getRawCommand();
        const options = this.getOptions();
        const id = this._getCacheId(request);

        const cachedObj = await bot.getCache().get(`${command}-exec`, id);
        if (!cachedObj) {
            await bot.getCache().set(`${command}-exec`, id, options.duration, response.reply);
        }
        return response;
    }
}

module.exports = CacheMiddleware;
