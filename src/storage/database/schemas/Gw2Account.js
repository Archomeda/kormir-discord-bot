'use strict';

const Schema = require('mongoose').Schema;

const Gw2Account = Schema({
    discordId: String,
    accountName: String,
    apiKey: String
});

module.exports = Gw2Account;
