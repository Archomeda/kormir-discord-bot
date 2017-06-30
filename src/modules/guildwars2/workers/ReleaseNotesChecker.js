'use strict';

const Discord = require('discord.js');

const { readRss } = require('../../../utils/rss');
const { convertHtmlToMarkdown } = require('../../../utils/markdown');

const Worker = require('../../../../bot/modules/Worker');


const thumbnailUrl = 'https://dviw3bl0enbyw.cloudfront.net/sprites/0000/0041/Frm_ICON_Announcements.jpg';
const rssFeed = 'https://forum-en.guildwars2.com/forum/info/updates.rss';


class WorkerReleaseNotesChecker extends Worker {
    constructor(bot) {
        super(bot, 'release-notes-checker');
        this._localizerNamespaces = 'module.guildwars2';
    }

    async check() {
        try {
            const [oldNotesUrl, notes] = await Promise.all([
                this.getLatestNotes(),
                this._checkNotes()
            ]);

            const allNotes = [];
            for (let i = 0; i < notes.length; i++) {
                if (notes[i].link === oldNotesUrl) {
                    break;
                }
                allNotes.push(notes[i]);
            }

            if (allNotes.length > 0) {
                // Set the latest notes to the last thread post
                await this.setLatestNotes(allNotes[0].link);
                if (oldNotesUrl) {
                    // Signal the first new thread post, because sometimes the release notes are very long
                    // and span multiple posts
                    await this.onNewNotes(allNotes[allNotes.length - 1]);
                }
            }
        } catch (err) {
            this.log(`Error while checking for new release notes: ${err.message}`, 'error');
        }
    }

    async _checkNotes() {
        let feed = await readRss(rssFeed);
        this.log(`Got latest release notes thread: ${feed.items[0].link}`, 'log');
        feed = await readRss(`${feed.items[0].link}.rss`);
        this.log(`Got latest release notes: ${feed.items[0].link}`, 'log');
        return feed.items;
    }

    async onNewNotes(notes) {
        const bot = this.getBot();
        const config = this.getConfig();
        const client = bot.getClient();
        const l = bot.getLocalizer();

        const notesId = notes.link ? parseInt(notes.link.match(/(\d+)$/)[1], 10) : 0;
        const time = new Date(notes.pubDate);
        this.log(`New release notes post: ${notesId}`);
        this.emit('new-notes', { notes, time });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            const description = convertHtmlToMarkdown(notes.description, 'feed')
                .replace(/^([a-zA-Z0-9 ]+\.\d{4})[^:]+: /, '');

            return channel.send('', {
                embed: new Discord.RichEmbed()
                    .setColor(config.get('richcolor'))
                    .setThumbnail(thumbnailUrl)
                    .setURL(notes.link)
                    .setTitle(l.t('module.guildwars2:release-notes-checker.notes-title', { title: notes.title }))
                    .setDescription(l.t('module.guildwars2:release-notes-checker.notes-description', { description }))
                    .setTimestamp(time)
            });
        }

        this.log(`Invalid channel ${channelId}`, 'error');
    }

    async getLatestNotes() {
        return this.getBot().getCache().get(this.getId(), 'notes');
    }

    async setLatestNotes(notes) {
        return this.getBot().getCache().set(this.getId(), 'notes', undefined, notes);
    }


    async enableWorker() {
        this._intervalId = setInterval(this.check.bind(this), 300000);
        return this.check();
    }

    async disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = WorkerReleaseNotesChecker;
