#!/usr/bin/env node
'use strict';

require('babel-polyfill');
require('./utils/prototypes');

const
    config = require('config'),
    Backend = require('i18next-node-fs-backend'),
    Discord = require('discord.js'),
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),
    moment = require('moment-timezone'),
    gw2Api = require('gw2api-client').default(),
    gw2ApiCache = require('gw2api-client/build/cache/memory').default,

    ModuleBase = require('./modules/Module'),
    CacheProvider = require('./storage/cache'),
    DatabaseProvider = require('./storage/database');

console.log('Starting bot...');

gw2Api.cacheStorage(gw2ApiCache());
const client = new Discord.Client();
const moduleConfigs = config.get('modules');
const modules = [];
const cache = new CacheProvider();
const database = new DatabaseProvider();
const timezone = config.get('timezone');

const bot = {
    get client() { return client; },
    get modules() { return modules; },
    get cache() { return cache; },
    get database() { return database; },
    get gw2Api() { return gw2Api; }
};

i18next.use(Backend).init({
    lng: config.get('language'),
    fallbackLng: false,
    ns: 'common',
    defaultNS: 'common',
    load: 'currentOnly',
    backend: {
        loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
        format: (value, format, lng) => {
            if (value instanceof Date) {
                return moment(value).tz(timezone).format(format);
            } else if (format === 'lcfirst') {
                return value.charAt(0).toLowerCase() + value.slice(1);
            }
            return value;
        },
        escape: str => str
    }
});
// TODO: sync the i18next locale to moment

i18next.on('failedLoading', (lng, ns, msg) => console.warn(`Failed to load i18n namespace '${ns}' for ${lng}: ${msg}`));
i18next.on('missingKey', (lng, ns, key, res) => console.warn(`Missing translation key '${key}' in namespace '${ns}' for ${lng}`));

cache.connect();
database.connect().then(() => {
    Promise.map(Object.keys(moduleConfigs), m => {
        if (!moduleConfigs[m]) return;
        return new Promise(resolve => {
            try {
                const Module = require(`./modules/${m}`);
                if (Module.prototype instanceof ModuleBase) {
                    modules.push(new Module(bot, moduleConfigs[m]));
                    console.log(`Module '${m}' loaded`);
                } else {
                    console.warn(`Module '${m}' does not export a class that extends ModuleBase, skipping`);
                }
            } catch(err) {
                console.warn(`Module '${m}' could not be loaded: ${err.message}`);
                console.warn(err.stack);
            }
            resolve();
        })
    }).then(() => {
        client.on('ready', () => {
            const guilds = client.guilds.array().map(g => g.name);
            const clientId = client.user.id;
            console.log(`Registered Discord guilds: ${guilds.join(', ')}`);
            console.info(`The following URL can be used to register the bot to a Discord guild: https://discordapp.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=8`);

            console.info('Ready');
        });

        client.on('guildCreate', guild => {
            console.log(`Joined Discord guild ${guild.name}`);
        });
        client.on('disconnect', () => {
            console.info('Disconnected from Discord');
        });

        client.on('reconnecting', () => {
            console.info('Reconnecting to Discord');
        });
        client.on('error', err => {
            console.warn(`Discord error: ${err.message}`);
        });

        console.log('Connecting to Discord...');
        client.login(config.get('discord.token'))
            .then(() => console.log('Connected'))
            .catch(err => console.error(`Could not connect to Discord: ${err.message}`));
    });
}).catch(err => {
    console.error(`${err.name}: ${err.message}`);
});
