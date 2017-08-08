'use strict';

const mongoose = require('mongoose');

const EventSchema = require('./Event');
const Gw2AccountSchema = require('./Gw2Account');


module.exports = {
    Event: mongoose.model('Event', EventSchema),
    Gw2Account: mongoose.model('Gw2Account', Gw2AccountSchema)
};
