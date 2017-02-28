'use strict';

/* eslint-env node, mocha */
const expect = require('chai').expect;
const prototypes = require('../../src/utils/discord.prototype');

const GuildMember = require('discord.js').GuildMember;
const User = require('discord.js').User;


describe('Discord.js prototype extensions', () => {
    it('gets the full username from a guild member', () => {
        const member = new GuildMember({}, {
            user: new User(null, {
                username: 'bob',
                discriminator: '1234'
            })
        });
        const expected = 'bob#1234';
        expect(prototypes.getFullUsername(member)).to.equal(expected);
        expect(member.fullUsername).to.equal(expected);
    });

    it('gets the full username from a user', () => {
        const user = new User({}, {
            username: 'bob',
            discriminator: '1234'
        });
        const expected = 'bob#1234';
        expect(prototypes.getFullUsername(user)).to.equal(expected);
        expect(user.fullUsername).to.equal(expected);
    });
});
