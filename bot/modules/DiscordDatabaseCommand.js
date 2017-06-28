'use strict';

const DiscordCommand = require('./DiscordCommand');
const DiscordCommandError = require('./DiscordCommandError');


/**
 * A Discord command that can map 1:1 to a database model.
 */
class DiscordDatabaseCommand extends DiscordCommand {
    /**
     * Creates a new Discord database command.
     * @param {Bot} bot - The bot instance.
     * @param {string} id - The command id.
     * @param {string[]} triggers - The command triggers.
     * @param {Model} Model - The database model.
     * @param {string} type = The command type.
     * @param {Object} [options] - Optional options for the command.
     */
    constructor(bot, id, triggers, Model, type, options) {
        super(bot, id, triggers, options);

        this._Model = Model;
        if (!['list', 'view', 'add', 'edit', 'delete'].includes(type)) {
            throw new TypeError('type is not a valid type (should be one of: list, view, add, edit, delete)');
        }
        this._type = type;
    }

    /**
     * The parameter mapping from the command parameters to the database fields.
     * Fields with the same name can be omitted.
     * If fields are defined as undefined, no mapping occurs.
     * @returns {Object<string, string>|undefined} The mapping from command parameters to database fields.
     */
    get paramsMap() {
        return undefined;
    }

    /**
     * Checks if the command can be executed in its current context.
     * @param {DiscordCommandRequest} request - The request.
     * @param {*} item - The item.
     */
    canExecute(request, item) {
        switch (this._type) {
            case 'list':
                return this.canList(request, item);
            case 'view':
                return this.canView(request, item);
            case 'add':
                return this.canAdd(request, item);
            case 'edit':
                if (!item || request.getMessage().author.id === item.owner) {
                    return this.canEditOwn(request, item);
                }
                return this.canEditOther(request, item);
            case 'delete':
                if (!item || request.getMessage().author.id === item.owner) {
                    return this.canDeleteOwn(request, item);
                }
                return this.canDeleteOther(request, item);
            default:
                return false;
        }
    }

    /**
     * Checks if the current command executor can list items.
     * @param {DiscordCommandRequest} request - The request.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canList(request, item) { // eslint-disable-line no-unused-vars
        return true;
    }

    /**
     * Checks if the current command executor can view an individual item.
     * @param {DiscordCommandRequest} request - The request.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canView(request, item) { // eslint-disable-line no-unused-vars
        return true;
    }

    /**
     * Checks if the current command executor can add items.
     * @param {DiscordCommandRequest} request - The request.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canAdd(request, item) { // eslint-disable-line no-unused-vars
        return true;
    }

    /**
     * Checks if the current command executor can edit their own item.
     * @param {DiscordCommandRequest} request - The request.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canEditOwn(request, item) { // eslint-disable-line no-unused-vars
        return true;
    }

    /**
     * Checks if the current command executor can edit an item that's not theirs.
     * @param {DiscordCommandRequest} request - The request.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canEditOther(request, item) { // eslint-disable-line no-unused-vars
        return this.isCommandAllowed(request.getMessage().member || request.getMessage().author, 'other') || false;
    }

    /**
     * Checks if the current command executor can delete their own item.
     * @param {DiscordCommandRequest} request - The request.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canDeleteOwn(request, item) { // eslint-disable-line no-unused-vars
        return true;
    }

    /**
     * Checks if the current command executor can delete an item that's not theirs.
     * @param {DiscordCommandRequest} request - The request.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canDeleteOther(request, item) { // eslint-disable-line no-unused-vars
        return this.isCommandAllowed(request.getMessage().member || request.getMessage().author, 'other') || false;
    }


    /**
     * Gets the respective item.
     * @param {Model} Model - The database model.
     * @param {Object<string, *>} props - The model properties.
     * @returns {Promise} The promise with the item.
     */
    async getExecute(Model, props) {
        switch (this._type) {
            case 'list':
                return this.getList(Model, props);
            case 'view':
                return this.getView(Model, props);
            case 'add':
                return this.getAdd(Model, props);
            case 'edit':
                return this.getEdit(Model, props);
            case 'delete':
                return this.getDelete(Model, props);
            default:
                return undefined; // Make linter happy
        }
    }

    /**
     * Gets the items.
     * @param {Model} Model - The database model.
     * @param {Object<string, *>} props - The model properties.
     * @returns {Promise} The promise with the item.
     */
    async getList(Model, props) { // eslint-disable-line no-unused-vars
        return Model.find({});
    }

    /**
     * Gets an individual item.
     * @param {Model} Model - The database model.
     * @param {Object<string, *>} props - The model properties.
     * @returns {Promise} The promise with the item.
     */
    async getView(Model, props) { // eslint-disable-line no-unused-vars
        return Model.findOne({ id: props.id });
    }

    /**
     * Gets a new item to add.
     * @param {Model} Model - The database model.
     * @param {Object<string, *>} props - The model properties.
     * @returns {Promise} The promise with the item.
     */
    async getAdd(Model, props) { // eslint-disable-line no-unused-vars
        return new Model(props);
    }

    /**
     * Gets an item to edit.
     * @param {Model} Model - The database model.
     * @param {Object<string, *>} props - The model properties.
     * @returns {Promise} The promise with the item.
     */
    async getEdit(Model, props) { // eslint-disable-line no-unused-vars
        return Model.findOne({ id: props.id });
    }

    /**
     * Gets an item to delete.
     * @param {Model} Model - The database model.
     * @param {Object<string, *>} props - The model properties.
     * @returns {Promise} The promise with the item.
     */
    async getDelete(Model, props) { // eslint-disable-line no-unused-vars
        return Model.findOne({ id: props.id });
    }


    /**
     * Transforms the value of a parameter.
     * @param {DiscordCommandRequest} request - The request.
     * @param {string} paramName - The command parameter name.
     * @param {*} paramValue - The parameter value.
     * @returns {*} The transformed parameter value.
     */
    transformParam(request, paramName, paramValue) { // eslint-disable-line no-unused-vars
        return paramValue;
    }

    /**
     * Validates the command parameters.
     * @param {DiscordCommandRequest} request - The request.
     * @param {Object<string, *>} props - The model properties.
     * @returns {boolean|string} True if all parameters are valid; otherwise a string explaining what is invalid.
     */
    validateProps(request, props) { // eslint-disable-line no-unused-vars
        return true;
    }

    /**
     * Converts command parameters to model properties.
     * @param {DiscordCommandRequest} request - The request.
     * @returns {Object<string, *>} The model properties.
     */
    convertParamsToProps(request) {
        const params = request.getParams();
        const props = {};
        for (const paramName in params) {
            if (params.hasOwnProperty(paramName)) {
                const propsName = this.paramsMap && this.paramsMap[paramName] ? this.paramsMap[paramName] : paramName;
                props[propsName] = this.transformParam(request, paramName, params[paramName]);
            }
        }
        props.owner = request.getMessage().author.id; // Explicitly add the owner
        return props;
    }

    /**
     * Formats the result of the performed action.
     * @param {DiscordCommandRequest} request - The request.
     * @param {*} result - The result.
     * @returns {Promise<string|DiscordReplyMessage|undefined>} The promise with the reply message, string, or undefined if there's no reply.
     */
    async formatResult(request, result) { // eslint-disable-line no-unused-vars
        throw new TypeError('Derivative should implement format');
    }


    async onCommand(request) {
        const bot = this.getBot();
        const l = bot.getLocalizer();

        const props = this.convertParamsToProps(request);
        const validation = this.validateProps(request, props);
        if (validation !== true) {
            throw new DiscordCommandError(validation);
        }

        const item = await this.getExecute(this._Model, props);
        if (!this.canExecute(request, item)) {
            return l.t('middleware.defaults:restrict-permissions.access-denied');
        }
        let result = item;
        switch (this._type) {
            case 'list':
            case 'view':
                break;
            case 'add':
                result = await item.save();
                break;
            case 'edit':
                result = await item.set(props).save();
                break;
            case 'delete':
                result = await item.remove();
                break;
            default:
                return;
        }
        return this.formatResult(request, result);
    }
}

module.exports = DiscordDatabaseCommand;
