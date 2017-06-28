'use strict';

const Middleware = require('../Middleware');


/**
 * A middleware that adds mentions to the message just before sending it.
 */
class ReplyWithMentionsMiddleware extends Middleware {
    /**
     * Creates a new middleware that adds mentions to the message.
     * @param {Bot} bot - The bot instance.
     * @param {DiscordCommand} command - The Discord command.
     * @param {Object<string, *>} [options] - Additional options for the middleware.
     */
    constructor(bot, command, options) {
        super(bot, 'replyWithMentions', command, options);

        this._defaultOptions = {
            order: 995
        };
    }

    async onReplyConstructed(response) {
        if (!response.reply) {
            return response;
        }

        const mentions = response.getTargetMentions().map(m => m.toString()).join(' ');
        if (!mentions) {
            return response;
        }

        if (!response.reply.text.includes(mentions)) {
            // Only apply the mentions when it hasn't been added manually already
            if (response.getTargetChannel().type === 'dm') {
                response.reply.text = this.getBot().getLocalizer().t('middleware.defaults:reply-with-mentions.response-dm', {
                    mentions,
                    message: response.reply.text
                });
            } else {
                response.reply.text = this.getBot().getLocalizer().t('middleware.defaults:reply-with-mentions.response-public', {
                    mentions,
                    message: response.reply.text
                });
            }
        }

        return response;
    }
}

module.exports = ReplyWithMentionsMiddleware;
