'use strict';

function getDatabaseProvider(provider) {
    switch (provider) {
        case 'mongodb':
            provider = require('./MongoProvider');
            break;
        default:
            throw new TypeError('No compatible database provider selected');
    }
    return provider;
}

module.exports = getDatabaseProvider;
