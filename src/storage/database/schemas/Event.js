'use strict';

const Schema = require('mongoose').Schema;
const AutoIncrement = require('mongoose-sequence');

const Event = Schema({
    owner: String,
    title: String,
    start: Date,
    end: Date,
    description: String,
    reminders: Array,
    channels: Array,
    mentions: Object
});
Event.plugin(AutoIncrement, {inc_field: 'id'});

module.exports = Event;
