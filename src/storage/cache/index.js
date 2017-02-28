'use strict';

const config = require('config');


let provider;
switch (config.get('cache.provider')) {
    case 'node':
        provider = require('./NodeProvider');
        break;
    case 'redis':
        provider = require('./RedisProvider');
        break;
    default:
        throw new Error('No compatible cache provider selected');
}

module.exports = provider;
