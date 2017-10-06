'use strict';

const random = require('random-js')();

const DiscordHook = require('../../../../bot/modules/DiscordHook');


class HookRespond extends DiscordHook {
    constructor(bot) {
        super(bot, 'respond');
        this._hooks = {
            message: this.onMessage.bind(this)
        };
        this._localizerNamespaces = 'module.fun';
    }

    async onMessage(message) {
        if (message.author.bot) {
            // Ignore bot messages
            return;
        }

        const config = this.getConfig();
        const l = this.getBot().getLocalizer();
        let regex;
        let response;

        if (config.get('quality')) {
            regex = new RegExp(l.t('module.fun:respond.quality-regex-match'), 'i');
            if (message.content.match(regex)) {
                response = random.pick(l.t('module.fun:respond.quality-responses', { returnObjects: true }));
            }
        }
        if (config.get('joko')) {
            regex = new RegExp(l.t('module.fun:respond.joko-regex-match'), 'i');
            if (message.content.match(regex)) {
                response = random.pick(l.t('module.fun:respond.joko-responses', { returnObjects: true }));
            }
        }

        if (response) {
            return message.channel.send(response);
        }
    }
}

module.exports = HookRespond;
