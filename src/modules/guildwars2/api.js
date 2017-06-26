'use strict';

const gw2Api = require('gw2api-client').default();
const gw2ApiCache = require('gw2api-client/build/cache/memory').default;

gw2Api.cacheStorage(gw2ApiCache());
// TODO: Support other locales

module.exports = gw2Api;
