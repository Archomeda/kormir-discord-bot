'use strict';

const { promisify } = require('util');
const redis = require('redis');

const Base = require('./Base');


/**
 * A caching backend using Redis.
 */
class RedisCache extends Base {
    async connect() {
        this._client = redis.createClient({
            host: this.getConfig().get('host'),
            port: this.getConfig().get('port'),
            socket: this.getConfig().get('socket'),
            password: this.getConfig().get('password'),
            database: this.getConfig().get('database')
        });
        this._get = promisify(this._client.get).bind(this._client);
        this._set = promisify(this._client.set).bind(this._client);
        this._setex = promisify(this._client.setex).bind(this._client);
        this._del = promisify(this._client.del).bind(this._client);
    }

    async disconnect() {
        this._client.quit();
        this._get = undefined;
        this._set = undefined;
        this._setex = undefined;
        this._del = undefined;
    }

    async get(table, id) {
        const result = await this._get(`${this.getConfig().get('prefix')}${table}:${id}`);
        return JSON.parse(result);
    }

    async set(table, id, ttl, value) {
        return ttl ?
            this._setex(`${this.getConfig().get('prefix')}${table}:${id}`, ttl, JSON.stringify(value)) :
            this._set(`${this.getConfig().get('prefix')}${table}:${id}`, JSON.stringify(value));
    }

    async remove(table, id) {
        const result = this._del(`${this.getConfig().get('prefix')}${table}:${id}`);
        return result > 0;
    }
}

module.exports = RedisCache;
