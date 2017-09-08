'use strict';


/**
 * Represents a reply page for Discord.
 */
class DiscordReplyPage {
    /**
     * Creates a new reply page.
     * @param {string} text - The reply page text.
     * @param {Object} [options] - The reply page options.
     */
    constructor(text, options) {
        /**
         * The message contents.
         * @type {string}
         */
        this.text = text;

        /**
         * The embedded message.
         * @type {RichEmbed|undefined}
         */
        this.embed = options && options.embed;

        /**
         * The associated emoji. If undefined, take default paging.
         * @type {string|undefined}
         */
        this.emoji = options && options.emoji;

        /**
         * Extra data.
         * @type {*}
         */
        this.data = options && options.data;
    }
}

module.exports = DiscordReplyPage;
