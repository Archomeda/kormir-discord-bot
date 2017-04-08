'use strict';

const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));
const random = require('random-js')();

const Command = require('../Command');
const CommandParam = require('../CommandParam');
const CommandError = require('../../errors/CommandError');
const CommandReplyMessage = require('../CommandReplyMessage');
const bot = require('../../bot');


class CommandQuaggan extends Command {
    constructor(module) {
        super(module, {
            defaultTrigger: 'quaggan'
        });

        i18next.loadNamespacesAsync('guildwars2').then(() => {
            this.helpText = i18next.t('guildwars2:quaggan.help');
            this.shortHelpText = i18next.t('guildwars2:quaggan.short-help');
            this.params = new CommandParam('quaggan_id', i18next.t('guildwars2:quaggan.param-quaggan-id'), true);
        });

        this.initializeMiddleware();
    }

    onCommand(response) {
        const quaggan = response.request.params.quaggan_id;
        let request = bot.gw2Api.quaggans();
        if (quaggan) {
            request = request.get(quaggan);
        } else {
            request = request.all();
        }

        return request.then(result => {
            if (Array.isArray(result)) {
                result = random.pick(result);
            }
            return new CommandReplyMessage('', { file: result.url });
        }).catch(err => {
            if (err.response.status !== 404 || err.content) {
                throw new CommandError(i18next.t('guildwars2:api.response-error', { error: err.content.text || err.content.error }));
            } else {
                throw new CommandError(i18next.t('guildwars2:api.response-down'));
            }
        });
    }
}

module.exports = CommandQuaggan;
