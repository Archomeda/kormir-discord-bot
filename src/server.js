#!/usr/bin/env node
'use strict';

/* eslint-disable import/no-unassigned-import */
require('babel-polyfill');
require('./utils/discord.prototype');
/* eslint-enable import/no-unassigned-import */

const config = require('config');
const Backend = require('i18next-node-fs-backend');
const Discord = require('discord.js');
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));
const filesize = require('filesize');
const moment = require('moment-timezone');
const gw2Api = require('gw2api-client').default();
const gw2ApiCache = require('gw2api-client/build/cache/memory').default;
const bot = require('./bot');

const ModuleBase = require('./modules/Module');
const CacheProvider = require('./storage/cache')(config.get('cache.provider'));
const DatabaseProvider = require('./storage/database')(config.get('database.provider'));

gw2Api.cacheStorage(gw2ApiCache());
const timezone = config.get('timezone');

console.log('Starting bot...');
bot.config = config;
bot.client = new Discord.Client();
bot.modules = [];
bot.cache = new CacheProvider();
bot.database = new DatabaseProvider();
bot.gw2Api = gw2Api;

i18next.use(Backend).init({
    lng: bot.config.get('language'),
    fallbackLng: false,
    ns: 'common',
    defaultNS: 'common',
    load: 'currentOnly',
    backend: {
        loadPath: './locales/{{lng}}/{{ns}}.json'
    },
    interpolation: {
        format: (value, format, lng) => {
            if (value instanceof Date) {
                return moment(value).tz(timezone).format(format);
            } else if (format) {
                switch (format) {
                    case 'lcfirst':
                        return value.charAt(0).toLowerCase() + value.slice(1);
                    case 'duration':
                        return moment.duration(value).humanize();
                    case 'filesize':
                        return filesize(value);
                }
            }
            return value;
        },
        escape: str => str
    }
});
// TODO: sync the i18next locale to moment

i18next.on('failedLoading', (lng, ns, msg) => console.warn(`Failed to load i18n namespace '${ns}' for ${lng}: ${msg}`));
i18next.on('missingKey', (lng, ns, key, res) => console.warn(`Missing translation key '${key}' in namespace '${ns}' for ${lng}`));


let cacheTries = 0;
let databaseTries = 0;

function connectCache() {
    cacheTries++;
    console.log(`Connecting to cache, try ${cacheTries}...`);
    return Promise.resolve(bot.cache.connect()).catch(function (err) {
        console.error(`${err.name}: ${err.message}`);
        if (cacheTries < 10) {
            return Promise.delay(5000).then(connectCache);
        }
        process.exit(10);
    });
}

function connectDatabase() {
    databaseTries++;
    console.log(`Connecting to database, try ${databaseTries}...`);
    return Promise.resolve(bot.database.connect()).catch(function (err) {
        console.error(`${err.name}: ${err.message}`);
        if (databaseTries < 10) {
            return Promise.delay(5000).then(connectDatabase);
        }
        process.exit(11);
    });
}

Promise.all([
    connectCache().then(() => console.log('Connected to cache')),
    connectDatabase().then(() => console.log('Connected to database'))
]).then(() => {
    const modules = Object.keys(config.get('modules'));
    Promise.map(modules, m => {
        return new Promise(resolve => {
            try {
                // eslint-disable-next-line import/no-dynamic-require
                const Module = require(`./modules/${m}`);
                if (Module.prototype instanceof ModuleBase) {
                    bot.modules.push(new Module());
                    console.log(`Module '${m}' loaded`);
                } else {
                    console.warn(`Module '${m}' does not export a class that extends ModuleBase, skipping`);
                }
            } catch (err) {
                console.warn(`Module '${m}' could not be loaded: ${err.message}`);
                console.warn(err.stack);
                process.exit(5);
            }
            resolve();
        });
    }).then(() => {
        bot.client.on('ready', () => {
            const guilds = bot.client.guilds.array().map(g => g.name);
            const clientId = bot.client.user.id;
            console.log(`Registered Discord guilds: ${guilds.join(', ')}`);
            console.info(`The following URL can be used to register the bot to a Discord guild: https://discordapp.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=8`);

            console.info('Ready');
        });

        bot.client.on('guildCreate', guild => {
            console.log(`Joined Discord guild ${guild.name}`);
        });
        bot.client.on('disconnect', () => {
            console.info('Disconnected from Discord');
        });

        bot.client.on('reconnecting', () => {
            console.info('Reconnecting to Discord');
        });
        bot.client.on('error', err => {
            console.warn(`Discord error: ${err.message}`);
        });

        console.log('Connecting to Discord...');
        bot.client.login(bot.config.get('discord.token'))
            .then(() => console.log('Connected to Discord'))
            .catch(err => console.error(`Could not connect to Discord: ${err.message}`));
    });
}).catch(err => {
    console.warn(`Error: ${err.message}`);
    console.warn(err.stack);
    process.exit(1);
});
