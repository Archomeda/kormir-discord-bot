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

    _addMentions(pages, channelType, mentions) {
        for (let i = 0; i < pages.length; i++) {
            if (!pages[i].text.includes(mentions)) {
                // Only apply the mentions when it hasn't been added manually already
                if (channelType === 'dm') {
                    pages[i].text = this.getBot().getLocalizer().t('middleware.defaults:reply-with-mentions.response-dm', {
                        mentions,
                        message: pages[i].text
                    });
                } else {
                    pages[i].text = this.getBot().getLocalizer().t('middleware.defaults:reply-with-mentions.response-public', {
                        mentions,
                        message: pages[i].text
                    });
                }
            }
        }
    }

    async onReplyConstructed(response) {
        if (!response.reply) {
            return response;
        }

        const mentions = response.getTargetMentions().map(m => m.toString()).join(' ');
        if (!mentions) {
            return response;
        }

        this._addMentions(response.reply.pages, response.getTargetChannel().type, mentions);
        return response;
    }
}

module.exports = ReplyWithMentionsMiddleware;
