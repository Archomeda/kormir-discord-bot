'use strict';

const Promise = require('bluebird');


/**
 * Represents a reply message for Discord.
 */
class DiscordReplyMessage {
    /**
     * Creates a new reply message.
     * @param {string} text - The reply message text.
     * @param {Object} [options] - The reply message options.
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
         * The embedded file.
         * @type {FileOptions|string|undefined}
         */
        this.file = options && options.file;

        /**
         * Gets called whenever the command reply has been posted.
         * @type {function(DiscordCommandResponse, Message)}
         */
        this._onReplyPosted = options && options.onReplyPosted;

        // TODO: support splitting messages somehow...
    }

    /**
     * Gets called whenever the command reply has been posted.
     * @param {DiscordCommandResponse} response - The command response object.
     * @param {Message} message - The Discord message.
     */
    onReplyPosted(response, message) {
        if (this._onReplyPosted) {
            return Promise.resolve(this._onReplyPosted(response, message));
        }
        return Promise.resolve(true);
    }
}

module.exports = DiscordReplyMessage;
