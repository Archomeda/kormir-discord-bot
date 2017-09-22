'use strict';

const Discord = require('discord.js');
const request = require('request-promise');

const { EMBED_DESCRIPTION_CHARACTER_LENGTH } = require('../../../../bot/Constants');

const Worker = require('../../../../bot/modules/Worker');


const thumbnailFolder = './resources/';
const thumbnailFile = 'game-notes.png';
const releaseNotesEndpoint = 'https://en-forum.guildwars2.com/categories/game-release-notes.json';


class WorkerReleaseNotesChecker extends Worker {
    constructor(bot) {
        super(bot, 'release-notes-checker');
        this._localizerNamespaces = 'module.guildwars2';
    }

    async check() {
        try {
            const oldNotesId = await this.getLatestNotesId();
            const liveNotes = await this._getLiveNotes(oldNotesId);

            if (!liveNotes) {
                // No new notes
                return;
            }

            await this.setLatestNotesId({ discussionId: liveNotes.discussionId, commentId: liveNotes.commentId });
            if (oldNotesId && liveNotes.content) {
                await this.onNewNotes(liveNotes);
            }
        } catch (err) {
            this.log(`Error while checking for new release notes: ${err.message}`, 'error');
        }
    }

    async _getLiveNotes(oldNotesId) {
        const discussions = (await request({ uri: releaseNotesEndpoint, json: true })).Discussions;
        if (discussions.length === 0) {
            this.log('No release notes discussions found', 'warn');
            return;
        }
        if (oldNotesId && discussions[0].DiscussionID === oldNotesId.discussionId && discussions[0].LastCommentID === oldNotesId.commentId) {
            this.log('No new release notes found', 'log');
            return;
        }

        // New notes
        this.log(`Got latest release notes discussion: ${discussions[0].Url}`, 'log');
        if (!discussions[0].LastCommentID) {
            // Just the main post
            return {
                discussionId: discussions[0].DiscussionID,
                commentId: null,
                date: new Date(`${discussions[0].FirstDate} +0`), // This date somehow isn't formatted in ISO-8601...
                author: discussions[0].FirstName,
                avatar: discussions[0].FirstPhoto,
                title: discussions[0].Name,
                content: [discussions[0].Body],
                url: discussions[0].Url
            };
        }
        const discussion = await request({ uri: `${discussions[0].Url}.json`, json: true });
        const comments = discussion.Comments.filter(c => oldNotesId && c.CommentID > oldNotesId.commentId);
        if (comments.length === 0) {
            this.log('No new release notes comments found', 'warn');
            return {
                discussionId: discussions[0].DiscussionID,
                commentId: discussions[0].LastCommentID
            };
        }
        this.log(`Got ${comments.length} new release notes comments`, 'log');
        return {
            disussionId: comments[0].DiscussionID,
            commentId: comments[comments.length - 1].CommentID,
            date: new Date(`${comments[0].DateInserted} +0`), // This date somehow isn't formatted in ISO-8601...
            author: comments[0].InsertName,
            avatar: comments[0].InsertPhoto,
            title: discussion.Discussion.Name,
            content: comments.map(c => c.Body),
            url: `${discussion.Discussion.Url}#Comment_${comments[0].CommentID}`
        };
    }

    async onNewNotes(notes) {
        const bot = this.getBot();
        const config = this.getConfig();
        const client = bot.getClient();
        const l = bot.getLocalizer();

        this.log(`New release notes post: ${notes.url}`);
        this.emit('new-notes', notes);

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            let description = notes.content[0].substr(0, EMBED_DESCRIPTION_CHARACTER_LENGTH - 3);
            if (description.length === EMBED_DESCRIPTION_CHARACTER_LENGTH - 3) {
                description += '...';
            }
            return channel.send('', {
                embed: new Discord.RichEmbed()
                    .setColor(config.get('richcolor'))
                    .attachFile(`${thumbnailFolder}${thumbnailFile}`)
                    .setThumbnail(`attachment://${thumbnailFile}`)
                    .setAuthor(notes.author, notes.avatar)
                    .setURL(notes.url)
                    .setTitle(l.t('module.guildwars2:release-notes-checker.notes-title', { title: notes.title }))
                    .setDescription(l.t('module.guildwars2:release-notes-checker.notes-description', { description }))
                    .setTimestamp(notes.date)
            });
        }

        this.log(`Invalid channel ${channelId}`, 'error');
    }

    async getLatestNotesId() {
        return this.getBot().getCache().get(this.getId(), 'notes');
    }

    async setLatestNotesId(id) {
        return this.getBot().getCache().set(this.getId(), 'notes', undefined, id);
    }


    async enableWorker() {
        this._intervalId = setInterval(this.check.bind(this), 300000);
        setTimeout(this.check.bind(this), 1000);
    }

    async disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = WorkerReleaseNotesChecker;
