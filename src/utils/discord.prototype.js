'use strict';

const GuildMember = require('discord.js').GuildMember;
const User = require('discord.js').User;


/**
 * Gets the full Discord username formatted as <name>#<discriminator>.
 * @param {(User|GuildMember)} user - The Discord user.
 * @return {string} The full Discord username.
 */
function getFullUsername(user) {
    if (user.user) {
        // This is a guild member, get the actual user
        user = user.user;
    }
    return `${user.username}#${user.discriminator}`;
}

Object.defineProperty(GuildMember.prototype, 'fullUsername', {
    /**
     * Gets the full Discord username formatted as <name>#<discriminator>.
     * @return {string} The full Discord username.
     */
    get: function () {
        return getFullUsername(this);
    }
});

Object.defineProperty(User.prototype, 'fullUsername', {
    /**
     * Gets the full Discord username formatted as <name>#<discriminator>.
     * @return {string} The full Discord username.
     */
    get: function () {
        return getFullUsername(this);
    }
});


module.exports = {
    getFullUsername
};
