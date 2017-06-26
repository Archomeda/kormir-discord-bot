'use strict';

const Discord = require('discord.js');
const random = require('random-js')();

const ThrottleMiddleware = require('../../../../bot/middleware/Throttle');

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');
const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');
const DiscordCommandParameter = require('../../../../bot/modules/DiscordCommandParameter');
const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const gw2Api = require('../api');


class CommandQuaggan extends DiscordCommand {
    constructor(bot) {
        super(bot, 'quaggan', ['quaggan']);
        this._localizerNamespaces = 'module.guildwars2';

        // Allow one quaggan per minute to be posted
        this.setMiddleware(new ThrottleMiddleware(bot, this, { type: 'command', duration: 60 }));
    }

    initializeParameters() {
        return new DiscordCommandParameter('id', { optional: true });
    }

    onCommand(request) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const module = this.getModule();
        const quaggan = request.getParams().id;

        if (module.isApiOnFire()) {
            throw new DiscordCommandError(l.t('module.guildwars2:api.response-fire'));
        }

        let apiRequest = gw2Api.quaggans();
        if (quaggan) {
            apiRequest = apiRequest.get(quaggan);
        } else {
            apiRequest = apiRequest.all();
        }

        return apiRequest.then(result => {
            if (Array.isArray(result)) {
                result = random.pick(result);
            }

            const embed = new Discord.RichEmbed().setTitle(l.t('module.guildwars2:quaggan.response', { id: result.id }))
                .setImage(result.url);

            return new DiscordReplyMessage('', { embed });
        }).catch(err => {
            throw new DiscordCommandError(module.parseApiError(err));
        });
    }
}

module.exports = CommandQuaggan;
