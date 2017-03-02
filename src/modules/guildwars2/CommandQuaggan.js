'use strict';

const Discord = require('discord.js');
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));
const random = require('random-js')();

const Command = require('../Command');
const CommandParam = require('../CommandParam');
const CommandError = require('../../errors/CommandError');
const UserThrottleMiddleware = require('../../middleware/UserThrottleMiddleware');
const bot = require('../../bot');


class CommandQuaggan extends Command {
    constructor(module) {
        super(module, {
            defaultTrigger: 'quaggan'
        });

        i18next.loadNamespacesAsync('guildwars2').then(() => {
            this.helpText = i18next.t('guildwars2:quaggan.help');
            this.shortHelpText = i18next.t('guildwars2:quaggan.short-help');
        });

        // TODO: Need to find a way to implement caching for non-text responses in the middleware and add it to this command
    }

    onCommand(response) {
        return bot.gw2Api.quaggans().all().then(quaggans => {
            const quaggan = random.pick(quaggans);

            return {
                options: {
                    file: quaggan.url
                }
            };
        }).catch(err => {
            throw new CommandError(i18next.t('guildwars2:api.response-error', { error: err.content.text }));
        });
    }
}

module.exports = CommandQuaggan;
