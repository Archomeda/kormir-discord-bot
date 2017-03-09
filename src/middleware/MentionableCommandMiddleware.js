'use strict';

const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const Middleware = require('./Middleware');


/**
 * A middleware that changes the targeted users based on the mentioned users.
 */
class MentionableCommandMiddleware extends Middleware {
    onCommand(response) {
        // Only users are supported, extend this when needed
        const message = response.request.message;
        if (message.mentions.users.size > 0) {
            response.targetUsers = message.mentions.users.filterArray(u => u.id !== message.author.id && !u.bot);
        }
        return response;
    }
}

module.exports = MentionableCommandMiddleware;
