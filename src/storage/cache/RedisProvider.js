'use strict';

const
    config = require('config'),
    Promise = require('bluebird'),
    redis = Promise.promisifyAll(require('redis')),

    Provider = require('./Provider');

const prefix = config.get('cache.redis.prefix');
const password = config.get('cache.redis.password');
const db = config.get('cache.redis.database');
const path = config.get('cache.redis.socket');
const host = config.get('cache.redis.host');
const port = config.get('cache.redis.port');

class RedisProvider extends Provider {
    connect() {
        const options = {};
        if (password) { options.password = password; }
        if (db) { options.db = db; }
        if (path) { options.path = path; }
        if (host) { options.host = host; }
        if (port) { options.port = port; }

        this.client = redis.createClient(options);
    }

    disconnect() {
        this.client.quit();
    }

    get(table, id) {
        return this.client.getAsync(`${prefix}${table}:${id}`).then(value => JSON.parse(value));
    }

    set(table, id, ttl, value) {
        if (ttl) {
            return this.client.setexAsync(`${prefix}${table}:${id}`, ttl, JSON.stringify(value));
        } else {
            return this.client.setAsync(`${prefix}${table}:${id}`, JSON.stringify(value));
        }
    }

    remove(table, id) {
        return this.client.delAsync(`${prefix}${table}:${id}`).then(result => result > 0);
    }
}

module.exports = RedisProvider;
