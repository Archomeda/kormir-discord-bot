'use strict';


/**
 * A Discord command response.
 */
class DiscordCommandResponse {
    /**
     * Creates a new Discord command response.
     * @param {DiscordCommandRequest} request - The original request.
     */
    constructor(request) {
        this._request = request;

        /**
         * The reply message.
         * @type {DiscordReplyMessage|Promise.<DiscordReplyMessage>|undefined}
         */
        this.reply = undefined;
    }

    /**
     * Gets the original request.
     * @returns {DiscordCommandRequest} The original request.
     */
    getRequest() {
        return this._request;
    }

    /**
     * Gets the target channel.
     * @returns {TextChannel|DMChannel|GroupDMChannel} The target channel.
     */
    getTargetChannel() {
        return this._targetChannel || this._request.getMessage().channel;
    }

    /**
     * Sets the target channel.
     * @param {TextChannel|DMChannel|GroupDMChannel|string|undefined} channel - The target channel.
     */
    setTargetChannel(channel) {
        if (typeof channel === 'string') {
            if (channel === 'dm') {
                channel = this.getRequest().getMessage().author.dmChannel;
            } else {
                channel = this.getRequest().getBot().channels[channel];
            }
        }
        this._targetChannel = channel;
    }

    /**
     * Gets the target user mentions.
     * @returns {User[]} The target user mentions.
     */
    getTargetMentions() {
        return this._targetMentions || [this._request.getMessage().author];
    }

    /**
     * Sets the target user mentions.
     * @param {User[]|undefined} mentions - The target mentions.
     */
    setTargetMentions(mentions) {
        this._targetMentions = mentions;
    }

    /**
     * Gets the error of this command response, if any.
     * @returns {Error|undefined} The error if it exists; undefined otherwise.
     */
    getError() {
        return this._error;
    }

    /**
     * Sets the error of this command response.
     * @param {Error|undefined} error - The error; use undefined to clear.
     */
    setError(error) {
        this._error = error;
    }
}

module.exports = DiscordCommandResponse;
