'use strict';

const Discord = require('discord.js');
const Promise = require('bluebird');

const { readRss } = require('../../../utils/rss');
const { convertHtmlToMarkdown } = require('../../../utils/markdown');

const Worker = require('../../../../bot/modules/Worker');


const thumbnailUrl = 'https://wiki.guildwars2.com/images/d/df/GW2Logo_new.png';
const rssFeed = 'https://www.guildwars2.com/en/feed/';


class BlogPostChecker extends Worker {
    constructor(bot) {
        super(bot, 'blog-post-checker');
        this._localizerNamespaces = 'module.guildwars2';
    }

    check() {
        Promise.all([
            this.getLatestBlog(),
            this.checkBlog()
        ]).then(([oldBlogUrl, blog]) => {
            const allBlogs = [];
            for (let i = 0; i < blog.length; i++) {
                if (blog[i].link === oldBlogUrl) {
                    break;
                }
                allBlogs.push(blog[i]);
            }

            if (allBlogs.length > 0) {
                // Set the latest blog to the newest blog
                return this.setLatestBlog(allBlogs[0].link).then(() => {
                    if (oldBlogUrl) {
                        // Signal all new blog posts, in reversed order
                        for (let i = allBlogs.length - 1; i >= 0; i--) {
                            this.onNewBlog(allBlogs[i]);
                        }
                    }
                });
            }
        }).catch(err => this.log(`Error while checking for new blog posts: ${err.message}`, 'error'));
    }

    checkBlog() {
        return readRss(rssFeed).then(feed => {
            this.log(`Got ${feed.items.length} blog posts`, 'log');
            return feed.items;
        });
    }

    onNewBlog(blog) {
        const bot = this.getBot();
        const config = this.getModule().getConfig().root(this.getId());
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
            channel.send('', {
                embed: new Discord.RichEmbed()
                    .setColor(config.get('richcolor'))
                    .setThumbnail(thumbnailUrl)
                    .setAuthor(blog.author)
                    .setURL(blog.link)
                    .setTitle(l.t('module.guildwars2:blog-post-checker.post-title', { title: blog.title }))
                    .setDescription(l.t('module.guildwars2:blog-post-checker.post-description', { description }))
                    .setTimestamp(time)
            });
        }
    }

    getLatestBlog() {
        return this.getBot().getCache().get(this.getId(), 'blog');
    }

    setLatestBlog(blog) {
        return this.getBot().getCache().set(this.getId(), 'blog', undefined, blog);
    }


    enableWorker() {
        this._intervalId = setInterval(this.check.bind(this), 600000);
        this.check();
    }

    disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = BlogPostChecker;
