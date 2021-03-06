'use strict';

const Discord = require('discord.js');
const moment = require('moment-timezone');
const scheduler = require('node-schedule');

const Worker = require('../../../../bot/modules/Worker');
const models = require('../../../models/index');


class WorkerScheduler extends Worker {
    constructor(bot) {
        super(bot, 'scheduler');
        this._localizerNamespaces = 'module.schedule';
    }

    scheduleEventReminders(event) {
        if (!this.isEnabled()) {
            return;
        }
        this.cancelEventReminders(event.id);

        const remindSchedule = [];
        for (const remindTime of event.reminders) {
            const remindDate = new Date(event.start);
            remindDate.setMinutes(remindDate.getMinutes() - remindTime);
            remindSchedule.push(scheduler.scheduleJob(remindDate, this.postEventReminder.bind(this, event)));
        }
        remindSchedule.push(scheduler.scheduleJob(event.start, async function (event) {
            if (event.recurring) {
                await this.scheduleRecurringEvent(event);
            }
            this._schedule.delete(event.id);
        }.bind(this, event)));
        this._schedule.set(event.id, remindSchedule);
    }

    async rescheduleAllEventReminders() {
        if (!this.isEnabled()) {
            return;
        }
        this.cancelAllEventReminders();

        const events = await models.Event.find({ start: { $gte: new Date() } });
        for (const event of events) {
            this.scheduleEventReminders(event);
        }
    }

    cancelEventReminders(eventId) {
        if (!this.isEnabled()) {
            return;
        }

        if (this._schedule && this._schedule.has(eventId)) {
            for (const reminder of this._schedule.get(eventId)) {
                reminder.cancel();
            }
        }
    }

    cancelAllEventReminders() {
        if (!this.isEnabled()) {
            return;
        }

        if (this._schedule) {
            for (const [, event] of this._schedule) {
                for (const reminder of event) {
                    reminder.cancel();
                }
            }
        }
        this._schedule = new Map();
    }

    async rescheduleAllRecurringEvents() {
        const events = await models.Event.find({ start: { $lt: new Date() }, recurring: { $gt: 0 } });
        return Promise.all(events.map(e => this.scheduleRecurringEvent(e)));
    }

    async scheduleRecurringEvent(event) {
        // Kind of ugly, but it works
        const newStart = moment(event.start);
        const newEnd = moment(event.end);
        while (newStart.isBefore()) {
            newStart.add(event.recurring, 'd');
            newEnd.add(event.recurring, 'd');
        }

        const recurringEvent = new models.Event({
            owner: event.owner,
            title: event.title,
            start: newStart.toDate(),
            end: newEnd.toDate(),
            description: event.description,
            reminders: event.reminders,
            channels: event.channels,
            mentions: event.mentions,
            recurring: event.recurring
        });
        event.recurring = undefined;

        await Promise.all([
            recurringEvent.save(),
            event.save()
        ]);
        this.scheduleEventReminders(recurringEvent);
    }

    postEventReminder(event) {
        if (!this.isEnabled()) {
            return;
        }

        const bot = this.getBot();
        const client = bot.getClient();
        const config = this.getModule().getConfig();
        const l = bot.getLocalizer();

        let description;
        if (event.start > new Date()) {
            description = l.t('module.schedule:scheduler.post-description', {
                title: event.title,
                time: moment().to(event.start),
                description: event.description
            });
        } else {
            description = l.t('module.schedule:scheduler.post-description-started', {
                title: event.title,
                description: event.description
            });
        }
        for (const channelId of event.channels) {
            const channel = client.channels.get(channelId);
            if (channel && channel.type === 'text') {
                try {
                    let mentions = [];
                    if (event.mentions) {
                        const users = event.mentions.users.map(user => channel.guild.members.get(user)).filter(m => m);
                        const roles = event.mentions.roles.map(role => channel.guild.roles.get(role)).filter(r => r);
                        mentions = users.concat(roles);
                    }
                    if (mentions.length > 0) {
                        mentions = l.t('module.schedule:scheduler.post-mentions', { mentions: mentions.join(' ') });
                    }
                    const embed = new Discord.RichEmbed()
                        .setTitle(l.t('module.schedule:scheduler.post-title', { title: event.title }))
                        .setDescription(description)
                        .setFooter(l.t('module.schedule:scheduler.post-footer', { id: event.id }))
                        .setColor(config.get('richcolor'))
                        .setTimestamp(event.start);
                    channel.send(mentions, { embed });
                } catch (err) {
                    console.log(`Failed to post reminder of event ${event.title} in channel #${channel.name}: ${err.message}`);
                    console.log(err);
                }
            }
        }
    }


    async enableWorker() {
        return Promise.all([
            this.rescheduleAllEventReminders(),
            this.rescheduleAllRecurringEvents()
        ]);
    }

    async disableWorker() {
        this.cancelAllEventReminders();
    }
}

module.exports = WorkerScheduler;
