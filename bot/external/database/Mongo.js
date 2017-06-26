'use strict';

const Promise = require('bluebird');
const mongoose = require('mongoose');

const Base = require('./Base');

mongoose.Promise = Promise;

class MongoDatabase extends Base {
    constructor(options) {
        super(options);
        mongoose.connection.on('error', err => console.error(`MongoDB connection error: ${err}`));
        mongoose.connection.on('open', () => console.log('Connected to MongoDB'));
    }

    connect() {
        return mongoose.connect(this.getConfig().get('uri'), { server: { reconnectTries: Number.MAX_VALUE } });
    }

    disconnect() {
        return mongoose.disconnect();
    }
}

module.exports = MongoDatabase;
