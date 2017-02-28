'use strict';

const Promise = require('bluebird');
const NodeCache = require('node-cache');

const Provider = require('./Provider');


class NodeProvider extends Provider {
    connect() {
        this._cache = Promise.promisifyAll(new NodeCache());
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

module.exports = NodeProvider;
