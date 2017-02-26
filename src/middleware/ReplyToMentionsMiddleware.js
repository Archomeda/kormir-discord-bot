'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    Middleware = require('./Middleware'),
    MiddlewareError = require('../errors/MiddlewareError');

class ReplyToMentionsMiddleware extends Middleware {
    constructor(options) {
        super(options);
        const defaultOptions = {
            strict: false
        };
        this.options = Object.assign({}, defaultOptions, options);

        i18next.loadNamespacesAsync('middleware');
    }

    onCommand(response) {
        const request = response.request;
        const mentions = request.message.mentions.users.filterArray(u => u.id !== request.message.author.id && !u.bot);

        if (this.options.strict && mentions.length === 0) {
            const channelName = request.message.channel.name || request.message.channel.type;
            throw new MiddlewareError(
                `No mentions given for command (user ${request.message.author.fullUsername}, command: ${request.command.trigger}, channel: #${channelName})`,
                'log',
                i18next.t('middleware:reply-to-mentioned-users.no-mentions')
            );
        }
        if (mentions.length > 0) {
            response.targetUsers = mentions;
        }
        return response;
    }
}

module.exports = ReplyToMentionsMiddleware;
