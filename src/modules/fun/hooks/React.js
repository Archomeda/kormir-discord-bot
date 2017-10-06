'use strict';

const DiscordHook = require('../../../../bot/modules/DiscordHook');


const hearts = ['❤', '🧡', '💚', '💛', '💙', '💜', '🖤', '♥', '💓', '💗'];


class HookReact extends DiscordHook {
    constructor(bot) {
        super(bot, 'react');
        this._hooks = {
            message: this.onMessage.bind(this)
        };
    }

    async onMessage(message) {
        if (message.author.bot) {
            // Ignore bot messages
            return;
        }

        const config = this.getConfig();

        if (config.get('heart')) {
            // Find all hearts
            for (const heart of hearts) {
                if (message.content.includes(heart)) {
                    return message.react(heart);
                }
            }
        }
    }
}

module.exports = HookReact;
