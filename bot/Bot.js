'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const Discord = require('discord.js');
const i18next = require('i18next');
const filesize = require('filesize');
const moment = require('moment-timezone');
const yaml = require('js-yaml');

const ConfigItem = require('./ConfigItem');
const BotError = require('./BotError');

const LocalizationBackend = require('./external/i18next/Backend');
const getCache = require('./external/cache');
const getDatabase = require('./external/database');

const { modules } = require('./modules');

const momentNlp = require('./utils/MomentNlp');
const { addLazyProperty } = require('./utils/LazyProperty');
const { wait } = require('./utils/Async');


i18next.loadNamespacesAsync = promisify(i18next.loadNamespaces);


/**
 * The Discord bot instance.
 */
class Bot {
    constructor() {
        // Load configs
        this._defaultConfig = yaml.safeLoad(fs.readFileSync(path.join(__dirname, './config/default.yml')));
        this._defaultAppConfig = yaml.safeLoad(fs.readFileSync('./config/default.yml'));
        const config = yaml.safeLoad(fs.readFileSync('./config/local.yml'));
        this._config = new ConfigItem(config, this._defaultConfig, this._defaultAppConfig);

        this._modules = [];

        addLazyProperty(this, '_cache', () => {
            let name = this._cacheName;
            if (!name) {
                name = this.getConfig().get('cache.provider');
            }
            if (name) {
                const config = this.getConfig().root(`cache.${name}`);
                return new (getCache(name))(config);
            }
        });
        addLazyProperty(this, '_database', () => {
            let name = this._databaseName;
            if (!name) {
                name = this.getConfig().get('database.provider');
            }
            if (name) {
                const config = this.getConfig().root(`database.${name}`);
                return new (getDatabase(name))(config);
            }
        });

        this.addModule(modules.Admin);
        this.addModule(modules.General);
    }

    /**
     * Adds a module to the Discord bot.
     * @param {function<Bot>} Module - The module class.
     */
    addModule(Module) {
        this._modules.push(new Module(this));
    }

    /**
     * Removes a module from the Discord bot.
     * @param {string} module - The module id.
     * @returns {Promise} The promise.
     */
    async removeModule(module) {
        const i = this._modules.findIndex(m => m.getId() === module);
        await this._modules[i].disable();
        this._modules.splice(i, 1);
    }

    /**
     * Gets the registered modules.
     * @returns {Module[]} The list of modules.
     */
    getModules() {
        return this._modules;
    }

    /**
     * Gets a module that is registered to the bot.
     * @param {function|string} Module - The module class or its id.
     * @returns {Module} The activity
     */
    getModule(Module) {
        if (typeof Module === 'string') {
            return this.getModules().find(a => a.getId() === Module);
        }
        return this.getModules().find(a => a instanceof Module);
    }


    /**
     * Gets the config used for the Discord bot.
     * @returns {Object} The config object.
     */
    getConfig() {
        return this._config;
    }

    /**
     * Gets the cache.
     * @returns {BaseCache|undefined} The cache instance; or undefined.
     */
    getCache() {
        return this._cache;
    }

    /**
     * Sets the cache to use. Supported caches: node, redis.
     * Use before calling .start() or .getCache().
     * @param {string} name - The cache type name.
     * @returns {BaseCache} The cache.
     */
    useCache(name) {
        if (this._cacheName) {
            throw new TypeError('Call .useCache(string) before calling .start() or .getCache().');
        }
        this._cacheName = name;
    }

    /**
     * Gets the database.
     * @returns {BaseDatabase|undefined} The database; or undefined.
     */
    getDatabase() {
        return this._database;
    }

    /**
     * Sets the database to use. Supported databases: mongodb.
     * Use before calling .start() or .getDatabase().
     * @param {string} name - The database.
     * @returns {BaseDatabase} The database.
     */
    useDatabase(name) {
        if (this._databaseName) {
            throw new TypeError('Call .useCache(string) before calling .start() or .getDatabase().');
        }
        this._databaseName = name;
    }


    /**
     * Gets the Discord client.
     * @returns {Discord.Client} The Discord client.
     */
    getClient() {
        return this._client;
    }

    /**
     * Gets the localizer.
     */
    getLocalizer() {
        return i18next;
    }


    /**
     * Start the bot.
     */
    async start() {
        const config = this.getConfig();

        console.log('Starting bot...');
        this._client = new Discord.Client();

        const language = config.get('language');
        const timezone = config.get('timezone');
        moment.locale(language);
        moment.tz.setDefault(timezone);
        momentNlp.setTimezone(timezone);

        // Set i18next
        const l = this.getLocalizer();
        l.use(LocalizationBackend).init({
            lng: language,
            fallbackLng: false,
            ns: ['common', 'errors.defaults', 'middleware.defaults'],
            defaultNS: 'common',
            load: 'currentOnly',
            backend: {
                loadPath: [
                    path.resolve('./locales/{{lng}}/{{ns}}.json'),
                    path.resolve(path.join(__dirname, './locales/{{lng}}/{{ns}}.json'))
                ]
            },
            interpolation: {
                format: (value, format) => {
                    if (value instanceof Date) {
                        return moment(value).format(format);
                    } else if (format) {
                        if (value) {
                            switch (format) {
                                case 'lcfirst':
                                    return value.charAt(0).toLowerCase() + value.slice(1);
                                case 'duration':
                                    return moment.duration(value).humanize();
                                case 'filesize':
                                    return filesize(value);
                                default:
                                    break; // Make linter happy
                            }
                        }
                    }
                    return value;
                },
                escape: s => s
            }
        });

        l.on('failedLoading', (lng, ns, msg) => console.warn(`Failed to load localization namespace '${ns}' for ${lng}: ${msg}`));
        l.on('missingKey', (lng, ns, key) => console.warn(`Missing translation for '${key}' in localization namespace '${ns}' for ${lng}`));

        // Start the bot
        await Promise.all([
            this._connectCache(),
            this._connectDatabase()
        ]);

        // Initialize modules
        await Promise.all(this._modules.map(async m => {
            try {
                await m.initialize();
                console.log(`Module '${m.getId()}' initialized`);
            } catch (err) {
                throw new BotError(5, `Module '${m.getId()}' could not be initialized: ${err.message}`, err);
            }
        }));

        try {
            await this._connectDiscord();
        } catch (err) {
            throw new BotError(1, err.message, err);
        }

        // Enable modules
        await Promise.all(this._modules.map(async m => {
            try {
                await m.enable();
                console.log(`Module '${m.getId()}' enabled`);
            } catch (err) {
                throw new BotError(5, `Module '${m.getId()}' could not be enabled: ${err.message}`, err);
            }
        }));
    }

    async _connectDiscord() {
        const c = this.getClient();
        c.on('ready', () => {
            const guilds = c.guilds.array().map(g => g.name);
            const clientId = c.user.id;
            console.info('Connected to Discord');
            console.log(`Registered Discord guilds: ${guilds.join(', ')}`);
            console.info(`The following URL can be used to register the bot to a Discord guild: https://discordapp.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=8`);
        });
        c.on('guildCreate', guild => {
            console.log(`Joined Discord guild ${guild.name}`);
        });
        c.on('disconnect', () => {
            console.info('Disconnected from Discord');
        });
        c.on('reconnecting', () => {
            console.info('Reconnecting to Discord...');
        });
        c.on('error', err => {
            console.warn(`Discord error: ${err.message}`);
        });

        console.info('Connecting to Discord...');

        try {
            await c.login(this.getConfig().get('discord.token'));
        } catch (err) {
            console.error(`Could not connect to Discord: ${err.message}`);
        }
        c.setMaxListeners(0); // Set max listeners on client to prevent the warning
    }

    async _connectCache() {
        if (!this.getCache()) {
            console.log('Cache support disabled');
            return;
        }

        let tries = 0;
        const connect = async () => {
            tries++;
            console.log(`Connecting to cache, try ${tries}...`);
            try {
                await this.getCache().connect();
            } catch (err) {
                console.error(`${err.name}: ${err.message}`);
                if (tries < 10) {
                    await wait(5000);
                    return connect();
                }
                throw new BotError(10, 'Exhausted number of tries trying to connect to the cache');
            }
        };
        await connect();
        console.log('Connected to cache');
    }

    async _connectDatabase() {
        if (!this.getDatabase()) {
            console.log('Database support disabled');
            return;
        }

        let tries = 0;
        const connect = async () => {
            tries++;
            console.log(`Connecting to database, try ${tries}...`);
            try {
                await this.getDatabase().connect();
            } catch (err) {
                console.error(`${err.name}: ${err.message}`);
                if (tries < 10) {
                    await wait(5000);
                    return connect();
                }
                throw new BotError(11, 'Exhausted number of tries trying to connect to the database');
            }
        };
        await connect();
        console.log('Connected to database');
    }
}

module.exports = Bot;
