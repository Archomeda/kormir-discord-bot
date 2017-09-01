'use strict';

const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);


const Event = new mongoose.Schema({
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
