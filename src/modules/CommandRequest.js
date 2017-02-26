'use strict';

const
    config = require('config'),
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandResponse = require('./CommandResponse'),
    CommandError = require('../errors/CommandError');

/**
 * Represents a command request.
 */
class CommandRequest {
    /**
     * Constructs a new CommandRequest.
     * @param {Module} module - The module.
     * @param {Message} message - The original received message.
     */
    constructor(module, message) {
        this._module = module;
        this._message = message;
    }

    /**
     * Gets whether the request is a valid command.
     * @return {boolean} True if valid; false otherwise.
     */
    isValid() {
        return this._module && this._command && this._params;
    }

    /**
     * Gets the associated module.
     * @return {Module} The module.
     */
    get module() {
        return this._module;
    }

    /**
     * Gets the original message.
     * @return {Message} The message.
     */
    get message() {
        return this._message;
    }

    /**
     * Gets the command.
     * @return {Command} The command.
     */
    get command() {
        return this._command;
    }

    /**
     * Gets the parameters.
     * @return {Object.<string, string>} The parameters.
     */
    get params() {
        return this._params;
    }

    /**
     * Creates a new response.
     * @return {CommandResponse} The response.
     */
    createResponse() {
        return new CommandResponse(this);
    }

    /**
     * Parses the message as a command string.
     */
    parseCommandString() {
        const messageMatch = this.message.content.match(new RegExp(`^${config.get('discord.command_prefix')}([^\\s]*)(?:\\s+([^]*))?$`));
        // If there's no likely command match, we do nothing
        if (!messageMatch) {
            return;
        }
        const trigger = messageMatch[1].toLowerCase();
        const command = this.module.commands.find(command => command.trigger === trigger);

        // If the command is empty, we do nothing
        if (!command) {
            return;
        }

        const params = {};
        let paramsCount = 0;
        const re = /(?:(?!\\)"([^]*?(?:[^\\]))"|(?!")([^ ]+))/g;
        for (let i = 0; i < command.params.length; i++) {
            if (messageMatch[2]) {
                let paramsMatch;
                do {
                    let _paramsMatch = re.exec(messageMatch[2]);
                    if (!_paramsMatch) {
                        break;
                    }
                    _paramsMatch = _paramsMatch[1] || _paramsMatch[2];
                    paramsMatch = paramsMatch ? `${paramsMatch} ${_paramsMatch}` : _paramsMatch;
                } while (command.params[i].isExpanded);

                if (paramsMatch) {
                    // Special cases for special param types
                    switch (command.params[i].type) {
                        case 'channels':
                            params[command.params[i].name] = this.message.mentions.channels.filter(channel => paramsMatch.includes(channel));
                            break;
                        case 'mentions':
                            params[command.params[i].name] = {
                                users: this.message.mentions.users.filter(user => paramsMatch.includes(user)),
                                roles: this.message.mentions.roles.filter(role => paramsMatch.includes(role)),
                                everyone: paramsMatch.includes('@everyone')
                            };
                            break;
                        default:
                            params[command.params[i].name] = paramsMatch;
                            break;
                    }
                    paramsCount++;
                } else {
                    break;
                }
            }
        }

        // Set the parsed command with parameters
        this._command = command;
        this._params = params;

        // If the parameter count does not line up, we throw an error
        if (paramsCount < command.params.filter(param => !param.isOptional).length) {
            throw new CommandError(i18next.t('module:command-mismatched-parameter-count'));
        }
    }
}

module.exports = CommandRequest;
