'use strict';

const Schema = require('mongoose').Schema;
const AutoIncrement = require('mongoose-sequence');


const Event = new Schema({
    owner: String,
    title: String,
    start: Date,
    end: Date,
    description: String,
    reminders: [Number],
    channels: [String],
    mentions: {
        roles: [String],
        users: [String]
    },
    recurring: Number
});
Event.plugin(AutoIncrement, { inc_field: 'id' }); // eslint-disable-line camelcase

module.exports = Event;
