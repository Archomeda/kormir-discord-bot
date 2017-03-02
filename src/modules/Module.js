'use strict';

const snakeCase = require('change-case').snakeCase;
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));
const random = require('random-js')();

const bot = require('../bot');
const RestrictChannelsMiddleware = require('../middleware/RestrictChannelsMiddleware');
const RestrictPermissionsMiddleware = require('../middleware/internal/RestrictPermissionsMiddleware');
const ReplyWithMentionsMiddleware = require('../middleware/internal/ReplyWithMentionsMiddleware');
const CommandRequest = require('./CommandRequest');


/**
 * Represents a base module for the bot.
 */
class Module {
    /**
     * Constructs a new base module.
     * @param {Object} [options] - Extra options to set for the module, only name and id are supported.
     */
    constructor(options) {
        if (new.target === Module) {
            throw new TypeError('Cannot construct Module instances directly');
        }
        i18next.loadNamespaces('module');

        this.name = (options && options.name) || new.target.name.replace(/(.*?)(Module)?/, '$1');
        this.id = (options && options.id) || snakeCase(this.name);

        this._config = bot.config.get(`modules.${this.id}`);
        this._commands = [];
        this._hooks = [];

        bot.client.on('message', this.onMessage.bind(this));
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
        const configMiddleware = bot.config.get('discord.command_middleware');
        for (let name in configMiddleware) {
            if (configMiddleware.hasOwnProperty(name)) {
                const options = configMiddleware[name];
                // eslint-disable-next-line import/no-dynamic-require
                const MiddlewareClass = require(`../middleware/${name}`);
                defaultMiddleware.push(new MiddlewareClass(options));
            }
        }

        const permissions = bot.config.get('permissions');
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
        for (let hookName in hook.hooks) {
            if (hook.hooks.hasOwnProperty(hookName)) {
                bot.client.on(hookName, hook.hooks[hookName].bind(hook));
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
                        // Not something that's worth notifying people, wipe the replyText
                        response.replyText = undefined;
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
            return response.callMiddlewareOnResponse().then(() => {
                // Send reply
                if (typeof response.replyText === 'string') {
                    return response.targetChannel.sendMessage(response.replyText);
                } else if (response.replyText.content && response.replyText.options) {
                    return response.targetChannel.send(response.replyText.content, response.replyText.options);
                }
            }).then(message => {
                if (message) {
                    // Call the middleware onReply
                    return response.callMiddlewareOnReply(message);
                }
            });
        });
    }
}

module.exports = Module;
