'use strict';

const Discord = require('discord.js');
const random = require('random-js')();

const ThrottleMiddleware = require('../../../../bot/middleware/Throttle');

const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const ApiBase = require('./ApiBase');


class CommandQuaggan extends ApiBase {
    constructor(bot) {
        super(bot, 'quaggan', ['quaggan :id?']);

        // Allow one quaggan per minute to be posted
        this.setMiddleware(new ThrottleMiddleware(bot, this, { type: 'command', duration: 60 }));
    }

    async onApiCommand(message, gw2Api, parameters) {
        const bot = this.getBot();
        const l = bot.getLocalizer();

        let quaggan;
        if (parameters.id) {
            quaggan = await gw2Api.quaggans().get(parameters.id);
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
