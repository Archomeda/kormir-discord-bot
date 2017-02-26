'use strict';

const config = require('config');

let provider;
switch(config.get('database.provider')) {
    case 'mongodb':
        provider = require('./MongoProvider');
        break;
    default:
        throw new Error('No compatible database provider selected');
        break;
}

module.exports = provider;
