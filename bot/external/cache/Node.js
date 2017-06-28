'use strict';

const { promisify } = require('util');
const NodeCache_ = require('node-cache');

const Base = require('./Base');


/**
 * A caching backend using Node.
 */
class NodeCache extends Base {
    async connect() {
        this._cache = new NodeCache_();
        this._get = promisify(this._cache.get);
        this._set = promisify(this._cache.set);
        this._del = promisify(this._cache.del);
    }

    async disconnect() {
        this._cache = undefined;
        this._get = undefined;
        this._set = undefined;
        this._del = undefined;
    }

    async get(table, id) {
        return this._get(`${table}:${id}`);
    }

    async set(table, id, ttl, value) {
        return this._set(`${table}:${id}`, value, ttl);
    }

    async remove(table, id) {
        const result = await this._del(`${table}:${id}`);
        return result > 0;
    }
}

module.exports = NodeCache;
