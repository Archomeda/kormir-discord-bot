'use strict';

const mongoose = require('mongoose');

const Base = require('./Base');

mongoose.Promise = global.Promise;


/**
 * A database backend using Mongo.
 */
class MongoDatabase extends Base {
    constructor(options) {
        super(options);
        mongoose.connection.on('error', err => console.error(`MongoDB connection error: ${err}`));
        mongoose.connection.on('open', () => console.log('Connected to MongoDB'));
    }

    async connect() {
        return mongoose.connect(this.getConfig().get('uri'), {
            useMongoClient: true,
            reconnectTries: Number.MAX_VALUE
        });
    }

    async disconnect() {
        return mongoose.disconnect();
    }
}

module.exports = MongoDatabase;
