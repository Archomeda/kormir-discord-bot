'use strict';

const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');
const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const DatabaseScheduleBase = require('./DatabaseScheduleBase');


class CommandEvents extends DatabaseScheduleBase {
    constructor(bot) {
        super(bot, 'event', ['event :id'], 'view');
    }

    async formatResult(message, result) {
        const l = this.getBot().getLocalizer();

        if (!result) {
            throw new DiscordCommandError(l.t('module.schedule:common.response-missing-event'));
        }

        const embed = this.getModule().createEventEmbed(message, result);
        return new DiscordReplyMessage('', { embed });
    }
}

module.exports = CommandEvents;
