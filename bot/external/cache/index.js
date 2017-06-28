'use strict';


function getCache(name) {
    switch (name.toLowerCase()) {
        case 'node':
            return require('./Node');
        case 'redis':
            return require('./Redis');
        default:
            throw new TypeError('Not a compatible cache');
    }
}

module.exports = getCache;
