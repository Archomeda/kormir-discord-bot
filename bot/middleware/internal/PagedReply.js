'use strict';

const Middleware = require('../Middleware');

const DiscordReplyMessage = require('../../modules/DiscordReplyMessage');


const replyCacheTable = 'paged-reply';
const replyReactionTtl = 15 * 60 * 1000; // 15 minutes


/**
 * Gets the cache message id.
 * @param {Message} message - The Discord message.
 * @returns {string} The cache message id.
 */
function getCacheMessageId(message) {
    return `${message.channel.id}.${message.id}`;
}

/**
 * Constructs a global on reaction function that gets called whenever a reaction is added to or removed from a Discord message.
 * This global function prevents many reaction hooks for Discord.js as it will only be called once.
 * @param {Bot} bot - The bot instance.
 * @returns {function<Promise<MessageReaction, User>>} The function.
 */
function constructGlobalOnReaction(bot) {
    return async (reaction, user) => {
        if (user.bot) {
            // Ignore bot reactions, for safety reasons
            return;
        }

        if (reaction.message.author.id !== bot.getClient().user.id) {
            // Ignore reactions on messages that are not ours
            return;
        }

        const cache = bot.getCache();

        const cacheObj = await cache.get(replyCacheTable, getCacheMessageId(reaction.message));
        if (!cacheObj.message) {
            // No cached pages
            return;
        }
        const message = DiscordReplyMessage.deserialize(cacheObj.message);

        if (user.id !== cacheObj.author) {
            // It's not the original author reacting to the message
            return;
        }

        const replyMessage = message.constructDiscordMessage(reaction.emoji.toString(), true);
        if (replyMessage) {
            return Promise.all([
                reaction.message.edit(...replyMessage),
                cache.set(replyCacheTable, getCacheMessageId(reaction.message), replyReactionTtl, { message: message.serialize(), author: cacheObj.author })
            ]);
        }
    };
}

/**
 * A middleware that adds support for a paged reply.
 */
class PagedReplyMiddleware extends Middleware {
    /**
     * Creates a new middleware that adds support for a paged reply.
     * @param {Bot} bot - The bot instance.
     * @param {DiscordCommand} command - The Discord command.
     * @param {Object<string, *>} [options] - Additional options for the middleware.
     */
    constructor(bot, command, options) {
        super(bot, 'pagedReply', command, options);
    }

    async onReplyPosted(response, message) {
        if (!response.reply || !response.reply.hasPages()) {
            // The response doesn't have a reply or the reply doesn't have pages
            return response;
        }

        const bot = this.getBot();
        if (!this._onReaction) {
            this._onReaction = constructGlobalOnReaction(bot);
            const client = bot.getClient();
            client.on('messageReactionAdd', this._onReaction);
            client.on('messageReactionRemove', this._onReaction);
        }

        if (!response.reply.pageEmojis) {
            response.reply.pageEmojis = bot.getConfig().get('/discord.commands.paged_reply.reactions').raw();
        }

        const pageEmojis = response.reply.pageEmojis;
        await message.react(pageEmojis.first);
        await message.react(pageEmojis.previous);
        await message.react(pageEmojis.next);
        await message.react(pageEmojis.last);

        const cache = bot.getCache();
        return cache.set(replyCacheTable, getCacheMessageId(message), replyReactionTtl, { message: response.reply.serialize(), author: response.getRequest().getMessage().author.id });
    }
}

module.exports = PagedReplyMiddleware;
