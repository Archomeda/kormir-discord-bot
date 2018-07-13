'use strict';

const Discord = require('discord.js');

const { readRss } = require('../../../utils/rss');
const { convertHtmlToMarkdown } = require('../../../utils/markdown');

const Worker = require('../../../../bot/modules/Worker');


const thumbnailFolder = './resources/';
const thumbnailFile = 'blog-post.png';
const rssFeed = 'https://www.guildwars2.com/en/feed/';


class WorkerBlogPostChecker extends Worker {
    constructor(bot) {
        super(bot, 'blog-post-checker');
        this._localizerNamespaces = 'module.guildwars2';
    }

    async check() {
        try {
            const [oldBlogDate, blog] = await Promise.all([
                this.getLatestBlog().then(d => new Date(d)),
                this._checkBlog()
            ]);

            const posts = blog.filter(b => new Date(b.pubDate) > oldBlogDate);
            if (posts.length > 0) {
                // Set the latest blog to the newest blog
                const latestDate = Math.max(...posts.map(p => new Date(p.pubDate).getTime()));
                await this.setLatestBlog(latestDate);
                if (oldBlogDate) {
                    // Signal all new blog posts, in reversed order
                    for (let i = posts.length - 1; i >= 0; i--) {
                        await this.onNewBlog(posts[i]); // eslint-disable-line no-await-in-loop
                    }
                }
            }
        } catch (err) {
            this.log(`Error while checking for new blog posts: ${err.message}`, 'error');
        }
    }

    async _checkBlog() {
        const feed = await readRss(rssFeed);
        this.log(`Got ${feed.items.length} blog posts`, 'log');
        return feed.items;
    }

    async onNewBlog(blog) {
        const bot = this.getBot();
        const config = this.getConfig();
        const client = bot.getClient();
        const l = bot.getLocalizer();

        const time = new Date(blog.pubDate);
        this.log(`New blog post: ${blog.link}`);
        this.emit('new-blog', { blog, time });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            const description = convertHtmlToMarkdown(blog.summary, 'feed')
                .replace(/\[read more]\([^)]+\)/i, '');

            return channel.send('', {
                embed: new Discord.RichEmbed()
                    .setColor(config.get('richcolor'))
                    .attachFile(`${thumbnailFolder}${thumbnailFile}`)
                    .setThumbnail(`attachment://${thumbnailFile}`)
                    .setAuthor(blog.author)
                    .setURL(blog.link)
                    .setTitle(l.t('module.guildwars2:blog-post-checker.post-title', { title: blog.title }))
                    .setDescription(l.t('module.guildwars2:blog-post-checker.post-description', { description }))
                    .setTimestamp(time)
            });
        }

        this.log(`Invalid channel ${channelId}`, 'error');
    }

    async getLatestBlog() {
        return parseInt(await this.getBot().getCache().get(this.getId(), 'blog'), 10);
    }

    setLatestBlog(blog) {
        return this.getBot().getCache().set(this.getId(), 'blog', undefined, blog);
    }


    async enableWorker() {
        this._intervalId = setInterval(this.check.bind(this), 600000);
        setTimeout(this.check.bind(this), 1000);
    }

    async disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = WorkerBlogPostChecker;
