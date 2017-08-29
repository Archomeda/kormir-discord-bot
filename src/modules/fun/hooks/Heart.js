'use strict';

const DiscordHook = require('../../../../bot/modules/DiscordHook');


const hearts = ['❤', '🧡', '💚', '💛', '💙', '💜', '🖤', '♥', '💓', '💗'];


class HookHeart extends DiscordHook {
    constructor(bot) {
        super(bot, 'heart');
        this._hooks = {
            message: this.onMessage.bind(this)
        };
    }

    async onMessage(message) {
        if (message.author.bot) {
            // Ignore bot messages
            return;
        }

        // Find all hearts
        for (const heart of hearts) {
            if (message.content.includes(heart)) {
                return message.react(heart);
            }
        }
    }
}

module.exports = HookHeart;
