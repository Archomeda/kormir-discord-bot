'use strict';

const Promise = require('bluebird');
const NodeCache_ = require('node-cache');

const Base = require('./Base');


class NodeCache extends Base {
    connect() {
        this._cache = Promise.promisifyAll(new NodeCache_());
    }

    disconnect() {
        this._cache = undefined;
    }

    get(table, id) {
        return this._cache.getAsync(`${table}:${id}`);
    }

    set(table, id, ttl, value) {
        return this._cache.setAsync(`${table}:${id}`, value, ttl);
    }

    remove(table, id) {
        return this._cache.delAsync(`${table}:${id}`).then(result => result > 0);
    }
}

module.exports = NodeCache;
