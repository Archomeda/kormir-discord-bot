'use strict';

const Promise = require('bluebird');
const redis = Promise.promisifyAll(require('redis'));

const Base = require('./Base');


class RedisCache extends Base {
    connect() {
        this.client = redis.createClient({
            host: this.getConfig().get('host'),
            port: this.getConfig().get('port'),
            socket: this.getConfig().get('socket'),
            password: this.getConfig().get('password'),
            database: this.getConfig().get('database')
        });
    }

    disconnect() {
        this.client.quit();
    }

    get(table, id) {
        return this.client.getAsync(`${this.getConfig().get('prefix')}${table}:${id}`).then(value => JSON.parse(value));
    }

    set(table, id, ttl, value) {
        return ttl ?
            this.client.setexAsync(`${this.getConfig().get('prefix')}${table}:${id}`, ttl, JSON.stringify(value)) :
            this.client.setAsync(`${this.getConfig().get('prefix')}${table}:${id}`, JSON.stringify(value));
    }

    remove(table, id) {
        return this.client.delAsync(`${this.getConfig().get('prefix')}${table}:${id}`).then(result => result > 0);
    }
}

module.exports = RedisCache;
