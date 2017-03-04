'use strict';

const Middleware = require('./Middleware');


class ReplyChannelMiddleware extends Middleware {
    constructor(options) {
        super(options);
        const defaultOptions = {
            channel: undefined
        };
        this.options = Object.assign({}, defaultOptions, options);
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
