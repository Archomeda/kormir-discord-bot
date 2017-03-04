'use strict';

const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const Middleware = require('./Middleware');


class MentionableCommandMiddleware extends Middleware {
    onCommand(response) {
        // Only users are supported, extend this when needed
        const request = response.request;
        response.targetUsers = request.message.mentions.users.filterArray(u => u.id !== request.message.author.id && !u.bot);
        return response;
    }
}

module.exports = MentionableCommandMiddleware;
