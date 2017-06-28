'use strict';

const _ = require('lodash');
const random = require('random-js')();

const Throttle = require('../middleware/Throttle');
const MiddlewareError = require('../middleware/MiddlewareError');
const CorrectNumberOfParameters = require('../middleware/internal/CorrectNumberOfParameters');
const ParameterError = require('../middleware/internal/ParameterError');
const PermissionError = require('../middleware/internal/PermissionError');
const ReplyWithMentions = require('../middleware/internal/ReplyWithMentions');
const RestrictPermissions = require('../middleware/internal/RestrictPermissions');
const ThrottleError = require('../middleware/ThrottleError');

const { wait } = require('../utils/Async');

const DiscordHook = require('./DiscordHook');
const DiscordCommandError = require('./DiscordCommandError');
const DiscordCommandRequest = require('./DiscordCommandRequest');
const DiscordCommandResponse = require('./DiscordCommandResponse');
const DiscordReplyMessage = require('./DiscordReplyMessage');


/**
 * A Discord command.
 */
class DiscordCommand extends DiscordHook {
    /**
     * Creates a new Discord command.
     * @param {Bot} bot - The bot instance.
     * @param {string} id - The command id.
     * @param {string[]} triggers - The command triggers.
     * @param {Object} [options] - Optional options for the command.
     */
    constructor(bot, id, triggers, options) {
        super(bot, id);

        this._hooks = {
            message: this.onMessage.bind(this)
        };

        this._triggers = triggers;
        this._options = options || {};

        const config = this.getBot().getConfig();
        this._permissions = config.get('/permissions').raw();
        this.setMiddleware(new RestrictPermissions(bot, this));
        this.setMiddleware(new Throttle(bot, this));
        this.setMiddleware(new CorrectNumberOfParameters(bot, this));
        this.setMiddleware(new ReplyWithMentions(bot, this));
    }

    /**
     * Checks if a command is allowed to be executed in the current context.
     * @param {User} user - The Discord user.
     * @param {string} [subPermission] - The sub-permission.
     * @returns {boolean} True if allowed; false otherwise.
     */
    isCommandAllowed(user, subPermission) {
        const groups = this._getUserPermissionGroups(user);
        const permissions = this._getPermissionsList();

        for (const name of groups) {
            const perm = permissions[name] ? permissions[name](subPermission) : undefined;
            if (perm !== undefined) {
                return Boolean(perm);
            }
        }
        return true; // By default allow
    }


    /**
     * Gets called whenever the command is being executed.
     * @param {DiscordCommandRequest} request - The request.
     * @returns {Promise<string|DiscordReplyMessage|undefined>} The promise with the reply message, string or undefined if there's no reply.
     */
    async onCommand(request) { // eslint-disable-line no-unused-vars

    }

    /**
     * Gets called whenever a message is created in Discord.
     * @param {Message} message - The Discord message.
     * @returns {Promise} The promise.
     */
    async onMessage(message) {
        // Ignore bot messages, for safety reasons
        if (message.author.bot) {
            return;
        }

        const l = this.getBot().getLocalizer();

        const request = new DiscordCommandRequest(this.getBot(), this, message);
        const rawCommand = request.getRawCommand();
        const commandStartTime = Date.now(); // Use this to delay the response for startTyping and stopTyping
        if (rawCommand !== undefined && this.getTriggers().includes(rawCommand.toLowerCase())) {
            // TODO: Add a UX friendly way of executing parameterized commands

            // Construct response
            let typing = false;
            let response = new DiscordCommandResponse(request);
            try {
                response = await this._callMiddlewareOnCommand(response);
                if (!response.reply) {
                    // Construct message
                    response.getTargetChannel().startTyping();
                    typing = true;
                    response.reply = await this.onCommand(response.getRequest());
                }
            } catch (err) {
                if (err instanceof PermissionError) {
                    response.reply = l.t('middleware.defaults:restrict-permissions.access-denied');
                } else if (err instanceof DiscordCommandError) {
                    response.reply = err.message;
                } else if (err instanceof ThrottleError && err.showError) {
                    response.reply = l.t('errors.defaults:commands.throttle');
                } else if (err instanceof ParameterError) {
                    const helpCommand = this.getBot().getModule('general').getActivity('help').getCommandTrigger();
                    const command = this.getTriggers()[0];
                    response.reply = l.t('errors.defaults:commands.wrong-parameter-count', { help: helpCommand, command });
                } else if (!(err instanceof MiddlewareError)) {
                    // TODO: Change to something less random
                    const code = random.hex(6).toUpperCase();
                    this.log(`Unexpected error: ${err.message} (error identifier: ${code})`, 'warn');
                    this.log(err.stack, 'warn');
                    response.reply = l.t('errors.defaults:commands.error', {
                        error: err.message || 'undefined',
                        code
                    });
                }
            }
            if (typeof response.reply === 'string') {
                response.reply = new DiscordReplyMessage(response.reply);
            }

            // Execute middleware
            response = await this._callMiddlewareOnReplyConstructed(response);

            // Wait a bit if the command has taken less than 300ms
            const timeDiff = Date.now() - commandStartTime;
            if (timeDiff < 300) {
                await wait(300 - timeDiff);
            }

            if (typing) {
                response.getTargetChannel().stopTyping(true);
            }

            // Send message
            let replyMessage;
            if (response.reply) {
                replyMessage = await response.getTargetChannel().send(response.reply.text, {
                    embed: response.reply.embed,
                    file: response.reply.file
                });
            }

            if (replyMessage) {
                // Execute last middleware
                response = await this._callMiddlewareOnReplyPosted(response, replyMessage);
                await response.reply.onReplyPosted(response, replyMessage);
            }
            return response;
        }
    }


    /**
     * Gets the triggers for this command.
     * @returns {string[]} The triggers.
     */
    getTriggers() {
        return this._triggers;
    }

    getCommandTrigger() {
        const prefix = this.getBot().getConfig().get('/discord.commands.prefix');
        const triggers = this.getTriggers();
        return triggers.length > 0 ? `${prefix}${triggers[0]}` : undefined;
    }

    /**
     * Gets the additional options for this command.
     * @returns {Object} The options.
     */
    getOptions() {
        return this._options;
    }

    /**
     * Gets the defined parameters of this command.
     * @returns {DiscordCommandParameter[]} The parameters.
     */
    getParameters() {
        return this.params || [];
    }

    /**
     * Initializes the parameters used for this command.
     * Has to be overridden in derivatives.
     * @returns (DiscordCommandParameter|DiscordCommandParameter[]) The parameters as an array.
     */
    initializeParameters() {

    }


    /**
     * Sets a middleware to use for the command.
     * @param {Middleware} middleware - The middleware object.
     */
    setMiddleware(middleware) {
        if (!this.middleware) {
            this.middleware = [];
        }

        this.removeMiddleware(middleware.getId());
        this.middleware.push(middleware);
        this.middleware.sort((a, b) => a.getOrder() - b.getOrder());
    }

    /**
     * Removes a middleware.
     * @param {string} id - The id.
     */
    removeMiddleware(id) {
        const i = this.middleware.findIndex(m => m.getId() === id);
        if (i > -1) {
            this.middleware.splice(i, 1);
        }
    }


    /**
     * Gets the permission groups a given user belongs to.
     * @param {User} user - The Discord user.
     * @returns {string[]} The permission groups.
     * @private
     */
    _getUserPermissionGroups(user) {
        const permissions = this._permissions;
        const groups = [];

        Object.keys(permissions).forEach(name => {
            const group = permissions[name];
            if ((group.user_ids && group.user_ids.includes(user.id)) ||
                (user.roles && group.role_ids && _.intersection(group.role_ids, user.roles.keyArray()).length > 0)) {
                groups.push(name);
            }
        });
        groups.push('default'); // Force push the default group
        return groups;
    }

    /**
     * Gets the permission list for the associated command, grouped by permission group.
     * @returns {Object.<string,function(string)>} The permission list.
     * @private
     */
    _getPermissionsList() {
        const permissions = this._permissions;
        const groups = {};

        Object.keys(permissions).forEach(name => {
            groups[name] = (group => id => {
                const permissionId = `${this.getModule().getId()}.${this.getId()}${id ? `:${id}` : ''}`;
                const check = p => permissionId.search(new RegExp(`^${p.replace('.', '\\.').replace('*', '[^:]*')}$`)) > -1;

                if (group.blacklist && group.blacklist.some(check)) {
                    return false;
                } else if (group.whitelist && group.whitelist.some(check)) {
                    return true;
                }
                return undefined;
            })(permissions[name]);
        });
        return groups;
    }


    /**
     * Calls all middleware with a specific function name.
     * @param {string} funcName - The function name.
     * @param {DiscordCommandResponse} response - The response object.
     * @param {*} params - The additional parameters to send.
     * @returns {Promise<DiscordCommandResponse>} The promise with the DiscordCommandResponse.
     * @private
     */
    async _callMiddleware(funcName, response, ...params) {
        if (!this.middleware || this.middleware.length === 0) {
            return response;
        }

        for (const middleware of this.middleware) {
            try {
                const returnedResponse = await middleware[funcName](response, ...params); // eslint-disable-line no-await-in-loop
                if (returnedResponse instanceof DiscordCommandResponse) {
                    // Make sure the returned response is a usable class instance
                    response = returnedResponse;
                }
            } catch (err) {
                if (err instanceof MiddlewareError) {
                    // Capture error
                    if (!response.getError()) {
                        response.setError(err);
                    }
                    this.log(`Middleware threw ${err.name} in ${funcName}: ${err.message}`, 'log');
                } else {
                    throw err;
                }
            }
        }

        return response;
    }

    /**
     * Calls all middleware on command request.
     * @param {DiscordCommandResponse} response - The response object.
     * @returns {Promise<DiscordCommandResponse>} The promise with the DiscordCommandResponse.
     * @private
     */
    async _callMiddlewareOnCommand(response) {
        response = await this._callMiddleware('onCommand', response);
        if (response.getError()) {
            // We have an error
            throw response.getError();
        }
        return response;
    }

    /**
     * Calls all middleware after the reply has been constructed.
     * @param {DiscordCommandResponse} response - The response object.
     * @returns {Promise<DiscordCommandResponse>} The promise with the DiscordCommandResponse.
     * @private
     */
    async _callMiddlewareOnReplyConstructed(response) {
        return this._callMiddleware('onReplyConstructed', response);
    }

    /**
     * Calls all middleware after the reply has been posted.
     * @param {DiscordCommandResponse} response - The response object.
     * @param {Message} message - The reply message.
     * @returns {Promise<DiscordCommandResponse>} The promise with the DiscordCommandResponse.
     * @private
     */
    async _callMiddlewareOnReplyPosted(response, message) {
        return this._callMiddleware('onReplyPosted', response, message);
    }


    async enableHook() {
        await super.enableHook();
        this.params = this.initializeParameters();
        if (!Array.isArray(this.params)) {
            this.params = [this.params];
        }
    }
}

module.exports = DiscordCommand;
