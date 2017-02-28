'use strict';

const config = require('config');
const camelCase = require('change-case').camelCase;
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));
const random = require('random-js')();

const RestrictChannelsMiddleware = require('../middleware/RestrictChannelsMiddleware');
const RestrictPermissionsMiddleware = require('../middleware/internal/RestrictPermissionsMiddleware');
const ReplyWithMentionsMiddleware = require('../middleware/internal/ReplyWithMentionsMiddleware');
const CommandRequest = require('./CommandRequest');


class Module {
    constructor(bot, moduleConfig) {
        if (new.target === Module) {
            throw new TypeError('cannot construct Module instances directly');
        }
        i18next.loadNamespaces('module');

        this.name = new.target.name.replace(/(.*?)(Module)?/, '$1');
        this.id = camelCase(this.name);
        this._bot = bot;
        this._config = moduleConfig;
        this._commands = [];
        this._hooks = [];

        this.bot.client.on('message', this.onMessage.bind(this));
    }

    get bot() {
        return this._bot;
    }

    get config() {
        return this._config;
    }

    get commands() {
        return this._commands;
    }

    get hooks() {
        return this._hooks;
    }

    registerCommand(command) {
        if (!command.config.enabled) {
            return;
        }
        command.trigger = command.config.trigger;

        const defaultMiddleware = [];
        const configMiddleware = config.get('discord.command_middleware');
        for (let name in configMiddleware) {
            if (configMiddleware.hasOwnProperty(name)) {
                const options = configMiddleware[name];
                // eslint-disable-next-line import/no-dynamic-require
                const MiddlewareClass = require(`../middleware/${name}`);
                defaultMiddleware.push(new MiddlewareClass(options));
            }
        }

        const permissions = config.get('permissions');
        defaultMiddleware.push(new RestrictPermissionsMiddleware({ permissions }));
        defaultMiddleware.push(new ReplyWithMentionsMiddleware());
        command.defaultMiddleware = defaultMiddleware;

        if (command.config.channels && command.config.channels.length > 0) {
            const commandMiddleware = command.middleware;
            const i = commandMiddleware.findIndex(m => m.name === 'RestrictChannelsMiddleware');
            if (i > -1) {
                commandMiddleware[i].options.channels =
                    commandMiddleware[i].options.channels.concat(command.config.channels);
            } else {
                commandMiddleware.push(new RestrictChannelsMiddleware({ types: 'text', channels: command.config.channels }));
            }
            command.middleware = commandMiddleware;
        }

        this._commands.push(command);
    }

    registerHook(hook) {
        if (!hook.config.enabled) {
            return;
        }
        const client = this.bot.client;
        for (let hookName in hook.hooks) {
            if (hook.hooks.hasOwnProperty(hookName)) {
                client.on(hookName, hook.hooks[hookName].bind(hook));
            }
        }
        this._hooks.push(hook);
    }

    onMessage(message) {
        let typing = false;
        let request = new CommandRequest(this, message);
        let response = request.createResponse();

        return Promise.try(() => request.parseCommandString()).catch(err => {
            response.error = err;
        }).then(() => {
            // Check validity of the command
            if (!request.isValid()) {
                return;
            }

            // Call the middleware onCommand
            return response.callMiddlewareOnCommand().then(response => {
                if (response.error) {
                    return;
                }

                // If we already have a reply, skip calling the command
                if (!response.replyText) {
                    // Start typing
                    if (response.targetChannel.startTyping) {
                        response.targetChannel.startTyping();
                        typing = true;
                    }

                    // Call actual command
                    response.replyText = response.callCommand();

                    // Clear the promises, if any
                    if (response.replyText && response.replyText.then) {
                        return Promise.resolve(response.replyText.then(text => {
                            response.replyText = text;
                        })).catch(err => {
                            response.error = err;
                        }).return(response);
                    }
                }
            });
        }).then(() => {
            // Build response string
            if (response.error) {
                // We got an error
                switch (response.error.name) {
                    case 'MiddlewareError':
                    case 'PermissionError':
                        // Some middleware error, filter error message
                        response.replyText = response.error.userMessage ? response.error.userMessage : null;
                        break;
                    case 'CommandError':
                        // A command error
                        response.replyText = response.error.message;
                        break;
                    case 'ThrottleError':
                        // Not something that's worth notifying people
                        break;
                    default: {
                        const code = random.hex(6).toUpperCase();
                        console.warn(`Unexpected error: ${response.error.message} (error identifier: ${code})`);
                        console.warn(response.error.stack);
                        response.replyText = i18next.t('module:command-error', { code });
                    }
                }
            }

            // If we got no response string, return immediately without sending a reply
            if (!response.replyText) {
                return response;
            }

            // Stop typing
            if (response.targetChannel && typing) {
                response.targetChannel.stopTyping();
            }

            // Call the middleware onResponse
            return response.callMiddlewareOnResponse()
                .then(() => response.targetChannel.sendMessage(response.replyText)) // Send reply
                .then(message => response.callMiddlewareOnReply(message)); // Call the middleware onReply
        });
    }
}

module.exports = Module;
