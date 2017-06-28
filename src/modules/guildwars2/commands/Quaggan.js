'use strict';

const Discord = require('discord.js');
const random = require('random-js')();

const ThrottleMiddleware = require('../../../../bot/middleware/Throttle');

const DiscordCommandParameter = require('../../../../bot/modules/DiscordCommandParameter');
const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const ApiBase = require('./ApiBase');


class CommandQuaggan extends ApiBase {
    constructor(bot) {
        super(bot, 'quaggan', ['quaggan']);

        // Allow one quaggan per minute to be posted
        this.setMiddleware(new ThrottleMiddleware(bot, this, { type: 'command', duration: 60 }));
    }

    initializeParameters() {
        return new DiscordCommandParameter('id', { optional: true });
    }

    async onApiCommand(request, gw2Api) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const quagganId = request.getParams().id;

        let quaggan;
        if (quagganId) {
            quaggan = await gw2Api.quaggans().get(quagganId);
        } else {
            quaggan = random.pick(await gw2Api.quaggans().all());
        }

        const embed = new Discord.RichEmbed()
            .setTitle(l.t('module.guildwars2:quaggan.response', { id: quaggan.id }))
            .setImage(quaggan.url);

        return new DiscordReplyMessage('', { embed });
    }
}

module.exports = CommandQuaggan;
