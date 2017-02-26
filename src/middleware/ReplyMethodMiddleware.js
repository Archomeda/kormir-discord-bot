'use strict';

const
    Middleware = require('./Middleware');

class ReplyMethodMiddleware extends Middleware {
    constructor(options) {
        super(options);
        const defaultOptions = {
            method: undefined,
        };
        this.options = Object.assign({}, defaultOptions, options);
    }

    onCommand(response) {
        const request = response.request;
        switch (this.options.method) {
            case 'dm':
                response.targetChannel = request.message.author.dmChannel;
                break;
            default:
                if (this.options.method) {
                    // Assume we have a channel id instead
                    response.targetChannel = request.message.guild.channels.get(this.options.channel);
                }
                break;
        }
        return response;
    }
}

module.exports = ReplyMethodMiddleware;
