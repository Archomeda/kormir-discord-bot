'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const PermissionError = require('../errors/PermissionError');
const ensureArray = require('../utils/array').ensureArray;
const Middleware = require('./Middleware');


/**
 * A middleware that restricts commands to be sent to specific channels.
 */
class RestrictChannelsMiddleware extends Middleware {
    constructor(options) {
        super(options);
        this.order = -995;
        this.options.types = ensureArray(this.options.types);
        this.options.channels = ensureArray(this.options.channels);
        i18next.loadNamespacesAsync('middleware');
    }

    get defaultOptions() {
        return {
            types: ['text', 'dm'],
            channels: []
        };
    }

    onCommand(response) {
        const request = response.request;
        const allowed = this.options.types.includes(request.message.channel.type) &&
            (this.options.channels.length === 0 || this.options.channels.includes(request.message.channel.id));

        if (!allowed) {
            let translationKey = ['middleware:restrict-channels.wrong-channel'];
            if (request.message.channel.type === 'text') {
                const targetChannels = this.options.channels.map(c => {
                    const channel = request.message.guild.channels.get(c);
                    return channel ? channel.toString() : undefined;
                }).filter(c => c);

                if (this.options.types.includes('dm')) {
                    if (targetChannels.length > 0) {
                        translationKey = ['middleware:restrict-channels.channels-and-dm-only', { channels: targetChannels.join(' ') }];
                    } else {
                        translationKey = ['middleware:restrict-channels.dm-only'];
                    }
                } else if (targetChannels.length > 0) {
                    translationKey = ['middleware:restrict-channels.channels-only', { channels: targetChannels.join(' ') }];
                }
            }

            throw new PermissionError(undefined, undefined, i18next.t(...translationKey));
        }
        return response;
    }
}

module.exports = RestrictChannelsMiddleware;
