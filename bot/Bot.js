'use strict';

const fs = require('fs');
const path = require('path');

const Discord = require('discord.js');
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));
const filesize = require('filesize');
const moment = require('moment-timezone');
const yaml = require('js-yaml');

const ConfigItem = require('./ConfigItem');
const BotError = require('./BotError');

const LocalizationBackend = require('./external/i18next/Backend');
const getCache = require('./external/cache');
const getDatabase = require('./external/database');

const ModuleAdmin = require('./modules/admin');
const ModuleGeneral = require('./modules/general');

const momentNlp = require('./utils/MomentNlp');
const { addLazyProperty } = require('./utils/LazyProperty');


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

        this.addModule(ModuleAdmin);
        this.addModule(ModuleGeneral);
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
     */
    removeModule(module) {
        const i = this._modules.findIndex(m => m.getId() === module);
        this._modules[i].disable();
        this._modules.splice(i, 1);
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
    start() {
        console.log('Starting bot...');
        this._client = new Discord.Client();

        const language = this.getConfig().get('language');
        const timezone = this.getConfig().get('timezone');
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
        return Promise.all([
            this._connectCache(),
            this._connectDatabase()
        ]).then(() => {
            // Initialize modules
            for (const module of this._modules) {
                try {
                    module.initialize();
                    console.log(`Module '${module.getId()}' initialized`);
                } catch (err) {
                    throw new BotError(5, `Module '${module.getId()}' could not be initialized: ${err.message}`, err);
                }
            }
        }).then(() => this._connectDiscord()).catch(err => {
            throw new BotError(1, err.message, err);
        }).then(() => {
            // Enable modules
            for (const module of this._modules) {
                try {
                    module.enable();
                    console.log(`Module '${module.getId()}' enabled`);
                } catch (err) {
                    throw new BotError(5, `Module '${module.getId()}' could not be enabled: ${err.message}`, err);
                }
            }
        });
    }

    _connectDiscord() {
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

        return c.login(this.getConfig().get('discord.token'))
            .catch(err => console.error(`Could not connect to Discord: ${err.message}`))
            .then(() => c.setMaxListeners(0)); // Set max listeners on client to prevent the warning
    }

    _connectCache() {
        if (!this.getCache()) {
            console.log('Cache support disabled');
            return;
        }

        let tries = 0;
        const connect = () => {
            tries++;
            console.log(`Connecting to cache, try ${tries}...`);
            return Promise.resolve(this.getCache().connect()).catch(err => {
                console.error(`${err.name}: ${err.message}`);
                if (tries < 10) {
                    return Promise.delay(5000).then(connect);
                }
                throw new BotError(10, 'Exhausted number of tries trying to connect to the cache');
            });
        };
        return connect().then('Connected to cache');
    }

    _connectDatabase() {
        if (!this.getDatabase()) {
            console.log('Database support disabled');
            return;
        }

        let tries = 0;
        const connect = () => {
            tries++;
            console.log(`Connecting to database, try ${tries}...`);
            return Promise.resolve(this.getDatabase().connect()).catch(err => {
                console.error(`${err.name}: ${err.message}`);
                if (tries < 2) {
                    return Promise.delay(5000).then(connect);
                }
                throw new BotError(11, 'Exhausted number of tries trying to connect to the database');
            });
        };
        return connect().then('Connected to database');
    }
}

module.exports = Bot;
