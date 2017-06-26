'use strict';

const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');
const DiscordCommandParameter = require('../../../../bot/modules/DiscordCommandParameter');
const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const DatabaseScheduleBase = require('./DatabaseScheduleBase');


class CommandEvents extends DatabaseScheduleBase {
    constructor(bot) {
        super(bot, 'event', ['event'], 'view');
    }

    initializeParameters() {
        return new DiscordCommandParameter('id');
    }

    formatResult(request, result) {
        const l = this.getBot().getLocalizer();

        if (!result) {
            throw new DiscordCommandError(l.t('module.schedule:common.response-missing-event'));
        }

        const embed = this.getModule().createEventEmbed(request.getMessage(), result);
        return new DiscordReplyMessage('', { embed });
    }
}

module.exports = CommandEvents;
