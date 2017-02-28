'use strict';

const config = require('config');
const Promise = require('bluebird');
const mongoose = require('mongoose');
const Provider = require('./Provider');
const Gw2AccountSchema = require('./schemas/Gw2Account');
const EventSchema = require('./schemas/Event');


mongoose.Promise = Promise;

const uri = config.get('database.mongodb.uri');

class MongoProvider extends Provider {
    constructor() {
        super();
        mongoose.connection.on('error', err => console.error(`MongoDB connection error: ${err}`));
        mongoose.connection.on('open', () => console.log('Connected to MongoDB'));
    }
    connect() {
        const conn = mongoose.connect(uri, { server: { reconnectTries: Number.MAX_VALUE } });
        this._gw2Account = mongoose.model('Gw2Account', Gw2AccountSchema);
        this._event = mongoose.model('Event', EventSchema);
        return conn;
    }

    disconnect() {
        return mongoose.disconnect();
    }

    get Gw2Account() {
        return this._gw2Account;
    }

    get Event() {
        return this._event;
    }
}

module.exports = MongoProvider;
