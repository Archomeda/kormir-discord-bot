'use strict';

const _ = require('lodash');
const snakeCase = require('change-case').snakeCase;

const ensureArray = require('../utils/array').ensureArray;
const bot = require('../bot');


/**
 * Represents a base command for the bot.
 */
class Command {
    /**
     * Constructs a new base command.
     * @param {Module} module - The module that owns this command.
     * @param {Object} [options] - Extra options to set for the module, only name, id and defaultTrigger are supported.
     */
    constructor(module, options) {
        if (new.target === Command) {
            throw new TypeError('Cannot construct Command instances directly');
        }

        this.name = (options && options.name) || new.target.name.replace(/(.*?)(Command)?/, '$1');
        this.id = (options && options.id) || snakeCase(this.name);

        this._config = module.config.get(`commands.${this.id}`);
        this._module = module;
        this._params = [];

        this._defaultMiddleware = [];
        this._middleware = [];

        this.trigger = this.config.has('trigger') ? this.config.get('trigger') : options && options.defaultTrigger;
        this.helpText = null;
        this.shortHelpText = null;

        if (!this.trigger) {
            throw new TypeError('The trigger property cannot be undefined or null');
        }
    }

    toString() {
        return `${bot.config.get('discord.command_prefix')}${this.trigger}`;
    }

    onCommand(response) {
        throw new TypeError('Derivative should implement onCommand');
    }

    get module() {
        return this._module;
    }

    get config() {
        return this._config;
    }

    get permissionId() {
        return `${this.module.id}.${this.id}`;
    }

    get params() {
        return this._params;
    }
    set params(params) {
        params = ensureArray(params);
        this._params = params.filter(p => p.name);
    }

    get allMiddleware() {
        return this._allMiddleware;
    }
    get defaultMiddleware() {
        return this._defaultMiddleware;
    }
    set defaultMiddleware(middleware) {
        this._defaultMiddleware = ensureArray(middleware);
        this._allMiddleware = this.defaultMiddleware.concat(this.middleware);
        this._allMiddleware.sort((a, b) => a.order - b.order);
    }
    get middleware() {
        return this._middleware;
    }
    set middleware(middleware) {
        this._middleware = ensureArray(middleware);
        this._allMiddleware = this.defaultMiddleware.concat(this.middleware);
        this._allMiddleware.sort((a, b) => a.order - b.order);
    }


    /**
     * Checks if a user has a specific permission.
     * @param {User} user - The user.
     * @param {string} [subPermission] - The sub-permission.
     * @return {boolean} True if the user has permission; false otherwise.
     */
    isExecutionAllowed(user, subPermission) {
        const groups = this._getUserPermissionGroups(user);
        const permissions = this._getPermissionsList();

        for (let name of groups) {
            const perm = permissions[name](subPermission);
            if (perm === false) {
                return false;
            } else if (perm === true) {
                return true;
            }
        }
        return true; // By default allow
    }

    /**
     * Gets the permission groups a given user belongs to.
     * @param {User} user - The user.
     * @return {string[]} The permission groups.
     * @private
     */
    _getUserPermissionGroups(user) {
        const permissions = bot.config.get('permissions');
        const groups = [];

        for (let name in permissions) {
            if (permissions.hasOwnProperty(name)) {
                const group = permissions[name];
                if ((group.user_ids && group.user_ids.includes(user.id)) ||
                    (user.roles && group.role_ids && _.intersection(group.role_ids, user.roles.keyArray()).length > 0)) {
                    groups.push(name);
                }
            }
        }
        groups.push('default'); // Force push the default group
        return groups;
    }

    /**
     * Gets the permission list for this command, grouped by permission group.
     * @return {Object.<string, function(string)>} The permission list.
     * @private
     */
    _getPermissionsList() {
        const permissions = bot.config.get('permissions');
        const groups = {};

        for (let name in permissions) {
            if (permissions.hasOwnProperty(name)) {
                groups[name] = (group => id => {
                    const permissionId = id ? `${this.permissionId}:${id}` : this.permissionId;
                    const check = p => permissionId.search(new RegExp(`^${p.replace('.', '\\.').replace('*', '[^:]*')}$`)) > -1;

                    if (group.blacklist.some(check)) {
                        return false;
                    } else if (group.whitelist.some(check)) {
                        return true;
                    }
                    return undefined;
                })(permissions[name]);
            }
        }
        return groups;
    }
}

module.exports = Command;
