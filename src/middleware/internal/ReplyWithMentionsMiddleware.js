'use strict';

const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const Middleware = require('../Middleware');


class ReplyWithMentionsMiddleware extends Middleware {
    constructor(options) {
        super(options);
        this.order = 995;
        i18next.loadNamespacesAsync('middleware');
    }

    onResponse(response) {
        if (!response.replyText) {
            return response;
        }

        const mentions = Array.isArray(response.targetUsers) ? response.targetUsers.map(u => u.toString()).join(' ') : response.targetUsers.toString();
        if (response.targetChannel.type === 'dm') {
            response.replyText = i18next.t('middleware:reply-with-mentions.response-dm', { mentions, message: response.replyText });
        } else {
            response.replyText = i18next.t('middleware:reply-with-mentions.response-public', { mentions, message: response.replyText });
        }

        return response;
    }
}

module.exports = ReplyWithMentionsMiddleware;
