'use strict';

const Middleware = require('./Middleware');


/**
 * A middleware that redirects the reply to a different text channel.
 */
class RedirectToChannelMiddleware extends Middleware {
    /**
     * Creates a new middleware that redirects the reply to a different text channel.
     * @param {Bot} bot - The bot instance.
     * @param {DiscordCommand} command - The Discord command.
     * @param {Object.<string,*>} [options] - Additional options for the middleware.
     */
    constructor(bot, command, options) {
        super(bot, 'redirectToChannel', command, options);

        this._defaultOptions = {
            channel: undefined,
            leaveRedirectMessage: true,
            removeOriginalMessage: 300 // Time in seconds for both the request and the redirect response; use undefined to disable
        };
    }

    onCommand(response) {
        const options = this.getOptions();

        if (options.leaveRedirectMessage) {
            // Leave a message to let the user know the response can be found elsewhere
            if (options.removeOriginalMessage) {
                const message = response.getRequest().getMessage();
                if (message.deletable) {
                    message.delete(options.removeOriginalMessage * 1000);
                }
            }

            let redirectMessage = this.getBot().getLocalizer().t('middleware.defaults:redirect-to-channel.redirect-message');
            const mentions = [response.getRequest().getMessage().author];
            if (response.getTargetChannel().type === 'dm') {
                redirectMessage = this.getBot().getLocalizer().t('middleware.defaults:reply-with-mentions.response-dm', { mentions, message: redirectMessage });
            } else {
                redirectMessage = this.getBot().getLocalizer().t('middleware.defaults:reply-with-mentions.response-public', { mentions, message: redirectMessage });
            }
            response.getTargetChannel().send(redirectMessage).then(message => {
                if (message.deletable) {
                    message.delete(options.removeOriginalMessage * 1000);
                }
            });
        }

        if (options.channel) {
            // This breaks the possibility of running the bot on more than one server
            // Might have to look into this later
            response.setTargetChannel(options.channel);
        }
        return response;
    }
}

module.exports = RedirectToChannelMiddleware;
