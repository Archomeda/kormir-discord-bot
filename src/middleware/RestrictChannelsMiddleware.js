'use strict';

const
    _ = require('lodash'),
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    Middleware = require('./Middleware'),
    PermissionError = require('../errors/PermissionError'),
    ensureArray = require('../utils/array').ensureArray;

class RestrictChannelsMiddleware extends Middleware {
    constructor(options) {
        super(options);
        this.order = -995;
        const defaultOptions = {
            types: ['text', 'dm'],
            channels: []
        };
        this.options = Object.assign({}, defaultOptions, options);
        this.options.types = ensureArray(this.options.types);
        this.options.channels = ensureArray(this.options.channels);

        i18next.loadNamespacesAsync('middleware');
    }

    onCommand(response) {
        const request = response.request;
        let allowed = this.options.types.includes(request.message.channel.type);
        let channels = _.flatten(
            this.options.channels.map(c => typeof c === 'function' ? c(request.message, request.command, request.params) : c)
        );
        allowed = allowed && channels && (channels.length === 0 || channels.includes(request.message.channel.id));

        if (!allowed) {
            let userMessage;
            if (request.message.guild) {
                const targetChannels = channels.map(c => {
                    const channel = request.message.guild.channels.get(c);
                    if (channel) {
                        return channel.toString();
                    }
                }).filter(c => c);

                if (this.options.types.includes('dm')) {
                    if (targetChannels.length > 0) {
                        userMessage = i18next.t('middleware:restrict-channels.channels-and-dm-only', { channels: targetChannels.join(' ') });
                    } else if (this.options.types.includes('dm')) {
                        userMessage = i18next.t('middleware:restrict-channels.dm-only');
                    }
                } else {
                    if (targetChannels.length > 0) {
                        userMessage = i18next.t('middleware:restrict-channels.channels-only', { channels: targetChannels.join(' ') });
                    }
                }
            }
            if (!userMessage) {
                userMessage = i18next.t('middleware:restrict-channels.wrong-channel');
            }

            const channelName = request.message.channel.name || request.message.channel.type;
            throw new PermissionError(
                `Wrong channel for command (user ${request.message.author.fullUsername}, command: ${request.command.trigger}, channel: #${channelName})`,
                'log',
                userMessage
            );
        }
        return response;
    }
}

module.exports = RestrictChannelsMiddleware;
