'use strict';

const random = require('random-js')();

const DiscordHook = require('../../../../bot/modules/DiscordHook');


class HookQuality extends DiscordHook {
    constructor(bot) {
        super(bot, 'quality');
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

        const l = this.getBot().getLocalizer();
        const regex = new RegExp(l.t('module.fun:quality.regex-match'), 'i');

        if (message.content.match(regex)) {
            const response = random.pick(l.t('module.fun:quality.responses', { returnObjects: true }));
            return message.channel.send(response);
        }
    }
}

module.exports = HookQuality;
