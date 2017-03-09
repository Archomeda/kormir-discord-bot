'use strict';

const Middleware = require('./Middleware');


/**
 * A middleware that changes the target channel.
 */
class ReplyChannelMiddleware extends Middleware {
    get defaultOptions() {
        return {
            channel: undefined
        };
    }

    onCommand(response) {
        const request = response.request;
        switch (this.options.channel) {
            case 'dm':
                response.targetChannel = request.message.author.dmChannel;
                break;
            default:
                response.targetChannel = request.message.guild.channels.get(this.options.channel);
                break;
        }
        return response;
    }
}

module.exports = ReplyChannelMiddleware;
