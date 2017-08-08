'use strict';

const Schema = require('mongoose').Schema;
const AutoIncrement = require('mongoose-sequence');


const Event = new Schema({
    owner: String,
    title: String,
    start: Date,
    end: Date,
    description: String,
    reminders: Array,
    channels: Array,
    mentions: Object,
    recurring: Number
});
Event.plugin(AutoIncrement, { inc_field: 'id' }); // eslint-disable-line camelcase

module.exports = Event;
