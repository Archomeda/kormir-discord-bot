'use strict';

const Discord = require('discord.js');

const Module = require('../../../bot/modules/Module');
const CommandEvents = require('./commands/Events');
const CommandEvent = require('./commands/Event');
const CommandAddEvent = require('./commands/AddEvent');
const CommandEditEvent = require('./commands/EditEvent');
const CommandDeleteEvent = require('./commands/DeleteEvent');
const WorkerScheduler = require('./workers/Scheduler');


class ModuleSchedule extends Module {
    constructor(bot) {
        super(bot, 'schedule');

        this.register(new CommandEvents(bot));
        this.register(new CommandEvent(bot));
        this.register(new CommandAddEvent(bot));
        this.register(new CommandEditEvent(bot));
        this.register(new CommandDeleteEvent(bot));

        this._scheduler = new WorkerScheduler(bot);
        this.register(this._scheduler);
    }

    getScheduler() {
        return this._scheduler;
    }

    createEventEmbed(message, event) {
        const bot = this.getBot();
        const client = bot.getClient();
        const config = this.getConfig();
        const l = bot.getLocalizer();

        let guild = message.guild;
        if (message.channel.type !== 'text' || !message.guild) {
            guild = client.channels.get(event.channels[0]).guild;
        }

        let channels = [];
        let mentions = [];
        if (guild) {
            channels = event.channels.map(channel => guild.channels.get(channel)).filter(c => c);
            if (event.mentions) {
                const users = event.mentions.users.map(user => message.guild.members.get(user)).filter(m => m).map(member => member.toString());
                const roles = event.mentions.roles.map(role => message.guild.roles.get(role)).filter(r => r).map(role => role.toString());
                mentions = users.concat(roles);
            }
        } else {
            channels.push(l.t('module.schedule:common.response-unknown'));
            mentions.push(l.t('module.schedule:common.response-unknown'));
        }

        let owner = message.guild.members.get(event.owner);
        owner = owner ? owner.nickname || owner.user.username : l.t('module.schedule:common.response-unknown');

        const embed = new Discord.RichEmbed()
            .setTitle(l.t('module.schedule:event.response-title', { title: event.title }))
            .setDescription(l.t('module.schedule:event.response-description', { description: event.description }))
            .setFooter(l.t('module.schedule:event.response-footer', { id: event.id, owner }))
            .setColor(config.get('richcolor'))
            .setTimestamp(event.start);

        if (!event.recurring) {
            embed.addField(
                l.t('module.schedule:event.response-schedule-title'),
                l.t('module.schedule:event.response-schedule-description', {
                    start: event.start,
                    end: event.end
                })
            );
        } else {
            embed.addField(
                l.t('module.schedule:event.response-schedule-title'),
                l.t('module.schedule:event.response-schedule-description-recurring', {
                    start: event.start,
                    end: event.end,
                    recurring: event.recurring
                })
            );
        }
        if (mentions.length === 0) {
            embed.addField(
                l.t('module.schedule:event.response-reminder-title'),
                l.t('module.schedule:event.response-reminder-description', {
                    reminders: event.reminders.map(reminder => `${reminder}m`).join(', '),
                    channels: channels.join(', ')
                })
            );
        } else {
            embed.addField(
                l.t('module.schedule:event.response-reminder-title'),
                l.t('module.schedule:event.response-reminder-description-mentions', {
                    reminders: event.reminders.map(reminder => `${reminder}m`).join(', '),
                    channels: channels.join(', '),
                    mentions: mentions.join(', ')
                })
            );
        }

        return embed;
    }
}

module.exports = ModuleSchedule;
