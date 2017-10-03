'use strict';

const Discord = require('discord.js');
const request = require('request-promise');

const entities = new (require('html-entities').AllHtmlEntities)();

const { EMBED_DESCRIPTION_CHARACTER_LENGTH } = require('../../../../bot/Constants');

const Worker = require('../../../../bot/modules/Worker');


const thumbnailFolder = './resources/';
const thumbnailFile = 'announcement.png';
const announcementsEndpoint = 'https://en-forum.guildwars2.com/categories/news-and-announcements.json';


class AnnouncementChecker extends Worker {
    constructor(bot) {
        super(bot, 'announcement-checker');
        this._localizerNamespaces = 'module.guildwars2';
    }

    async check() {
        try {
            const oldAnnouncementId = await this.getLatestAnnouncementId();
            const liveAnnouncements = await this._getLiveAnnouncements(oldAnnouncementId);

            if (liveAnnouncements.length === 0) {
                // No new announcement
                return;
            }

            const lastDiscussionId = liveAnnouncements.reduce((id, a) => id < a.discussionId ? a.discussionId : id, 0);
            const lastCommentId = liveAnnouncements.reduce((id, a) => id < a.commentId ? a.commentId : id, 0);
            this.log(`Set latest announcement ids to D=${lastDiscussionId} and C=${lastCommentId}`, 'log');
            await this.setLatestAnnouncementId({ discussionId: lastDiscussionId, commentId: lastCommentId });

            if (oldAnnouncementId) {
                for (const announcement of liveAnnouncements) {
                    await this.onNewAnnouncement(announcement); // eslint-disable-line no-await-in-loop
                }
            }
        } catch (err) {
            this.log(`Error while checking for new announcements: ${err.message}`, 'error');
        }
    }

    async _getLiveAnnouncements(oldAnnouncementId) {
        const discussions = (await request({ uri: announcementsEndpoint, json: true })).Discussions;
        if (discussions.length === 0) {
            this.log('No announcement discussions found', 'warn');
            return;
        }

        // Iterate over all the discussion to find all new announcements
        return (await Promise.all(discussions.map(async d => {
            if (oldAnnouncementId && d.DiscussionID <= oldAnnouncementId.discussionId && d.LastCommentID <= oldAnnouncementId.commentId) {
                // Old announcement
                return;
            }

            let posts = [];
            if (!oldAnnouncementId || d.DiscussionID > oldAnnouncementId.discussionId) {
                // New announcement post
                posts.push({
                    discussionId: d.DiscussionID,
                    commentId: null,
                    date: new Date(`${d.FirstDate} +0`), // For some reason this date isn't ISO-8601...
                    author: d.FirstName,
                    avatar: d.FirstPhoto,
                    title: entities.decode(d.Name).trim(),
                    content: entities.decode(d.Body).trim(),
                    url: d.Url
                });
            }

            if (!oldAnnouncementId || d.LastCommentID > oldAnnouncementId.commentId) {
                // New comment on an announcement
                const discussion = await request({ uri: `${d.Url}.json`, json: true });
                const comments = discussion.Comments
                    .filter(c => !oldAnnouncementId || c.CommentID > oldAnnouncementId.commentId)
                    .map(c => ({
                        discussionId: c.DiscussionID,
                        commentId: c.CommentID,
                        date: new Date(`${c.DateInserted} +0`), // For some reason this date isn't ISO-8601...
                        author: c.InsertName,
                        avatar: c.InsertPhoto,
                        title: entities.decode(discussion.Discussion.Name).trim(),
                        content: entities.decode(c.Body).trim(),
                        url: `${discussion.Discussion.Url}#Comment_${c.CommentID}`
                    }));
                posts = posts.concat(comments);
            }
            return posts;
        }))).filter(a => a).reduce((a, b) => a.concat(b), [])
            .sort((a, b) => a.date - b.date);
    }

    async onNewAnnouncement(announcement) {
        const bot = this.getBot();
        const config = this.getConfig();
        const client = bot.getClient();
        const l = bot.getLocalizer();

        this.log(`New announcement post: ${announcement.url}`);
        this.emit('new-announcement', announcement);

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            let description = announcement.content[0].substr(0, EMBED_DESCRIPTION_CHARACTER_LENGTH - 3);
            if (description.length === EMBED_DESCRIPTION_CHARACTER_LENGTH - 3) {
                description += '...';
            }
            return channel.send('', {
                embed: new Discord.RichEmbed()
                    .setColor(config.get('richcolor'))
                    .attachFile(`${thumbnailFolder}${thumbnailFile}`)
                    .setThumbnail(`attachment://${thumbnailFile}`)
                    .setAuthor(announcement.author, announcement.avatar)
                    .setURL(announcement.url)
                    .setTitle(l.t('module.guildwars2:announcement-checker.announcement-title', { title: announcement.title }))
                    .setDescription(l.t('module.guildwars2:announcement-checker.announcement-description', { description }))
                    .setTimestamp(announcement.date)
            });
        }

        this.log(`Invalid channel ${channelId}`, 'error');
    }

    async getLatestAnnouncementId() {
        return this.getBot().getCache().get(this.getId(), 'announcement');
    }

    async setLatestAnnouncementId(id) {
        return this.getBot().getCache().set(this.getId(), 'announcement', undefined, id);
    }


    async enableWorker() {
        this._intervalId = setInterval(this.check.bind(this), 60 * 60 * 1000);
        setTimeout(this.check.bind(this), 1000);
    }

    async disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = AnnouncementChecker;
