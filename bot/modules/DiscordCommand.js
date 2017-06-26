'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const random = require('random-js')();

const Throttle = require('../middleware/Throttle');
const MiddlewareError = require('../middleware/MiddlewareError');
const PermissionError = require('../middleware/internal/PermissionError');
const ReplyWithMentions = require('../middleware/internal/ReplyWithMentions');
const RestrictPermissions = require('../middleware/internal/RestrictPermissions');
const ThrottleError = require('../middleware/ThrottleError');

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
        this.setMiddleware(new ReplyWithMentions(bot, this));
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


    enableHook() {
        super.enableHook();
        this.params = this.initializeParameters();
        if (!Array.isArray(this.params)) {
            this.params = [this.params];
        }
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
     * Gets called whenever a message is created in Discord.
     * @param {Message} message - The Discord message.
     */
    onMessage(message) {
        // Ignore bot messages, for safety reasons
        if (message.author.bot) {
            return;
        }

        const l = this.getBot().getLocalizer();

        const request = new DiscordCommandRequest(this.getBot(), this, message);
        const rawCommand = request.getRawCommand();
        const commandStartTime = Date.now(); // Use this to delay the response for startTyping and stopTyping
        if (rawCommand !== undefined && this._triggers.includes(rawCommand.toLowerCase())) {
            // TODO: Add a UX friendly way of executing parameterized commands

            const response = new DiscordCommandResponse(request);
            let typing = false;
            return this.callMiddlewareOnCommand(response).then(response => {
                if (response.reply) {
                    // We have a reply already
                    return response.reply;
                }

                // Construct message
                response.getTargetChannel().startTyping();
                typing = true;
                return this.onCommand(response.getRequest());
            }).catch(PermissionError, () => {
                return l.t('middleware.defaults:restrict-permissions.access-denied');
            }).catch(DiscordCommandError, err => {
                return err.message;
            }).catch(err => {
                if (!(err instanceof MiddlewareError)) {
                    // TODO: Change to something less random
                    const code = random.hex(6).toUpperCase();
                    console.warn(`Unexpected error: ${err.message} (error identifier: ${code})`);
                    console.warn(err.stack);
                    return l.t('errors.defaults:commands.error', {
                        error: err.message || 'undefined',
                        code
                    });
                } else if (err.showError && err instanceof ThrottleError) {
                    return l.t('errors.defaults:commands.throttle');
                }
                // Explicitly clear the reply message
                response.reply = undefined;
            }).then(result => {
                if (!result) {
                    return response;
                }

                if (typeof result === 'string') {
                    result = new DiscordReplyMessage(result);
                }
                response.reply = result;
                return this.callMiddlewareOnReplyConstructed(response);
            }).then(response => {
                const doReply = response => {
                    if (response.reply) {
                        return response.getTargetChannel().send(response.reply.text, {
                            embed: response.reply.embed,
                            file: response.reply.file
                        });
                    }
                };
                const timeDiff = Date.now() - commandStartTime;
                if (timeDiff < 300) {
                    return Promise.delay(300 - timeDiff).then(() => doReply(response));
                }
                return doReply(response);
            }).then(message => {
                if (typing) {
                    response.getTargetChannel().stopTyping();
                }

                if (!message) {
                    return;
                }
                return this.callMiddlewareOnReplyPosted(response, message)
                    .then(response => response.reply.onReplyPosted(response, message).return(response));
            });
        }
    }

    /**
     * Gets called whenever the command is being executed.
     * @param {DiscordCommandRequest|Promise<DiscordCommandRequest>} request - The request.
     * @returns {string|Promise<string>|DiscordReplyMessage|Promise<DiscordReplyMessage>|undefined|Promise<undefined>} The reply message, or undefined if there's no reply.
     */
    onCommand(request) { // eslint-disable-line no-unused-vars

    }


    /**
     * Calls all middleware on command request.
     * @param {DiscordCommandResponse} response - The response object.
     * @returns {Promise.<DiscordCommandResponse>} The promise with the DiscordCommandResponse.
     */
    callMiddlewareOnCommand(response) {
        return this._callMiddleware('onCommand', response).then(response => {
            if (response.getError()) {
                // We have an error
                throw response.getError();
            }
            return response;
        });
    }

    /**
     * Calls all middleware after the reply has been constructed.
     * @param {DiscordCommandResponse} response - The response object.
     * @returns {Promise.<DiscordCommandResponse>} The promise with the DiscordCommandResponse.
     */
    callMiddlewareOnReplyConstructed(response) {
        return this._callMiddleware('onReplyConstructed', response);
    }

    /**
     * Calls all middleware after the reply has been posted.
     * @param {Message} message - The reply message.
     * @param {DiscordCommandResponse} response - The response object.
     * @returns {Promise.<DiscordCommandResponse>} The promise with the DiscordCommandResponse.
     */
    callMiddlewareOnReplyPosted(response, message) {
        return this._callMiddleware('onReplyPosted', response, message);
    }

    /**
     * Calls all middleware with a specific function name.
     * @param {string} funcName - The function name.
     * @param {DiscordCommandResponse} response - The response object.
     * @param {*} params - The additional parameters to send.
     * @returns {Promise.<DiscordCommandResponse>} The promise with the DiscordCommandResponse.
     * @private
     */
    _callMiddleware(funcName, response, ...params) {
        let responsePromise = Promise.resolve(response);
        if (!this.middleware || this.middleware.length === 0) {
            return responsePromise;
        }

        for (const middleware of this.middleware) {
            responsePromise = responsePromise.then(response => Promise.try(() => middleware[funcName](response, ...params)).catch(MiddlewareError, err => {
                // Capture error
                if (!response.getError()) {
                    response.setError(err);
                }
                console.log(`Middleware threw ${err.name} in ${funcName}: ${err.message}`);
                return response;
            }));
        }

        return responsePromise;
    }
}

module.exports = DiscordCommand;
