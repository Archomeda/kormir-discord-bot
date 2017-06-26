'use strict';

function getDatabase(name) {
    switch (name.toLowerCase()) {
        case 'mongodb':
            return require('./Mongo');
        default:
            throw new TypeError('Not a compatible database');
    }
}

module.exports = getDatabase;
