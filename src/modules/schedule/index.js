'use strict';

const Discord = require('discord.js');
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));
const moment = require('moment');
const scheduler = require('node-schedule');

const bot = require('../../bot');
const Module = require('../Module');
const CommandEvents = require('./CommandEvents');
const CommandEvent = require('./CommandEvent');
const CommandAddEvent = require('./CommandAddEvent');
const CommandEditEvent = require('./CommandEditEvent');
const CommandDeleteEvent = require('./CommandDeleteEvent');


class ModuleSchedule extends Module {
    constructor() {
        super();
        i18next.loadNamespacesAsync('schedule');

        this.registerCommand(new CommandEvents(this));
        this.registerCommand(new CommandEvent(this));
        this.registerCommand(new CommandAddEvent(this));
        this.registerCommand(new CommandEditEvent(this));
        this.registerCommand(new CommandDeleteEvent(this));

        this.schedule = new Map();
        this.rescheduleAllEventReminders();
    }

    rescheduleAllEventReminders() {
        for (let [, event] of this.schedule) {
            for (let reminder of event) {
                reminder.cancel();
            }
        }
        this.schedule = new Map();

        return bot.database.Event.find({ start: { $gte: new Date() } }).then(events => {
            for (let event of events) {
                this.scheduleEventReminders(event);
            }
        });
    }

    scheduleEventReminders(event) {
        this.cancelEventReminders(event.id);

        const remindSchedule = [];
        for (let remindTime of event.reminders) {
            const remindDate = new Date(event.start);
            remindDate.setMinutes(remindDate.getMinutes() - remindTime);
            remindSchedule.push(scheduler.scheduleJob(remindDate, this.postEventReminder.bind(this, event)));
        }
        remindSchedule.push(scheduler.scheduleJob(event.start, function (id) {
            this.schedule.delete(id);
        }.bind(this, event.id)));
        this.schedule.set(event.id, remindSchedule);
    }

    cancelEventReminders(eventId) {
        if (this.schedule.has(eventId)) {
            for (let reminder of this.schedule.get(eventId)) {
                reminder.cancel();
            }
        }
    }

    postEventReminder(event) {
        const timeToEvent = moment().to(event.start);
        for (let channelId of event.channels) {
            const channel = bot.client.channels.get(channelId);
            if (channel && channel.type === 'text') {
                try {
                    let message;
                    if (event.mentions) {
                        let mentions = [];
                        const users = event.mentions.users.map(user => channel.guild.members.get(user)).filter(member => member);
                        const roles = event.mentions.roles.map(role => channel.guild.roles.get(role)).filter(role => role);
                        mentions = users.concat(roles);
                        if (event.mentions.everyone) {
                            mentions.push('@everyone');
                        }
                        if (mentions.length > 0) {
                            message = i18next.t('schedule:reminder.post-mentions', { mentions: mentions.join(' ') });
                        }
                    }
                    const embed = new Discord.RichEmbed()
                        .setColor([0, 200, 200])
                        .setTitle(event.title)
                        .setDescription(i18next.t('schedule:reminder.post', { title: event.title, time: timeToEvent, description: event.description }));
                    channel.sendEmbed(embed, message);
                } catch (err) {
                    console.log(`Failed to post reminder of event ${event.title} in channel #${channel.name}: ${err.message}`);
                    console.log(err);
                }
            }
        }
    }
}

module.exports = ModuleSchedule;
