'use strict';

const User = require('discord.js').User;


Object.defineProperty(User.prototype, 'fullUsername', {
    /**
     * Gets the full Discord username formatted as <name>#<discriminator>.
     * @return {string} The full Discord username.
     */
    get: function () {
        return `${this.username}#${this.discriminator}`;
    }
});
