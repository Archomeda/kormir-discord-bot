'use strict';

function getCacheProvider(provider) {
    switch (provider) {
        case 'node':
            provider = require('./NodeProvider');
            break;
        case 'redis':
            provider = require('./RedisProvider');
            break;
        default:
            throw new TypeError('No compatible cache provider selected');
    }
    return provider;
}

module.exports = getCacheProvider;
