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
     * @param {Message} message - The Discord message.
     * @param {*} item - The item.
     */
    canExecute(message, item) {
        switch (this._type) {
            case 'list':
                return this.canList(message, item);
            case 'view':
                return this.canView(message, item);
            case 'add':
                return this.canAdd(message, item);
            case 'edit':
                if (!item || message.author.id === item.owner) {
                    return this.canEditOwn(message, item);
                }
                return this.canEditOther(message, item);
            case 'delete':
                if (!item || message.author.id === item.owner) {
                    return this.canDeleteOwn(message, item);
                }
                return this.canDeleteOther(message, item);
            default:
                return false;
        }
    }

    /**
     * Checks if the current command executor can list items.
     * @param {Message} message - The Discord message.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canList(message, item) { // eslint-disable-line no-unused-vars
        return true;
    }

    /**
     * Checks if the current command executor can view an individual item.
     * @param {Message} message - The Discord message.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canView(message, item) { // eslint-disable-line no-unused-vars
        return true;
    }

    /**
     * Checks if the current command executor can add items.
     * @param {Message} message - The Discord message.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canAdd(message, item) { // eslint-disable-line no-unused-vars
        return true;
    }

    /**
     * Checks if the current command executor can edit their own item.
     * @param {Message} message - The Discord message.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canEditOwn(message, item) { // eslint-disable-line no-unused-vars
        return true;
    }

    /**
     * Checks if the current command executor can edit an item that's not theirs.
     * @param {Message} message - The Discord message.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canEditOther(message, item) { // eslint-disable-line no-unused-vars
        return this.isCommandAllowed(message.member || message.author, 'other') || false;
    }

    /**
     * Checks if the current command executor can delete their own item.
     * @param {Message} message - The Discord message.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canDeleteOwn(message, item) { // eslint-disable-line no-unused-vars
        return true;
    }

    /**
     * Checks if the current command executor can delete an item that's not theirs.
     * @param {Message} message - The Discord message.
     * @param {*} item - The item.
     * @returns {boolean} True if allowed; false otherwise.
     */
    canDeleteOther(message, item) { // eslint-disable-line no-unused-vars
        return this.isCommandAllowed(message.member || message.author, 'other') || false;
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
     * @param {Message} message - The Discord message.
     * @param {string} paramName - The command parameter name.
     * @param {*} paramValue - The parameter value.
     * @returns {*} The transformed parameter value.
     */
    transformParam(message, paramName, paramValue) { // eslint-disable-line no-unused-vars
        return paramValue;
    }

    /**
     * Validates the command parameters.
     * @param {Message} message - The Discord message.
     * @param {Object<string, *>} props - The model properties.
     * @returns {boolean|string} True if all parameters are valid; otherwise a string explaining what is invalid.
     */
    validateProps(message, props) { // eslint-disable-line no-unused-vars
        return true;
    }

    /**
     * Converts command parameters to model properties.
     * @param {Message} message - The Discord message.
     * @param {Object} parameters - The parameters.
     * @returns {Object<string, *>} The model properties.
     */
    convertParamsToProps(message, parameters) {
        const props = {};
        for (const paramName in parameters) {
            if (parameters.hasOwnProperty(paramName)) {
                const propsName = this.paramsMap && this.paramsMap[paramName] ? this.paramsMap[paramName] : paramName;
                props[propsName] = this.transformParam(message, paramName, parameters[paramName]);
            }
        }
        props.owner = message.author.id; // Explicitly add the owner
        return props;
    }

    /**
     * Formats the result of the performed action.
     * @param {Message} message - The Discord message.
     * @param {*} result - The result.
     * @returns {Promise<string|DiscordReplyMessage|undefined>} The promise with the reply message, string, or undefined if there's no reply.
     */
    async formatResult(message, result) { // eslint-disable-line no-unused-vars
        throw new TypeError('Derivative should implement format');
    }


    async onCommand(message, parameters) {
        const bot = this.getBot();
        const l = bot.getLocalizer();

        const props = this.convertParamsToProps(message, parameters);
        const validation = this.validateProps(message, props);
        if (validation !== true) {
            throw new DiscordCommandError(validation);
        }

        const item = await this.getExecute(this._Model, props);
        if (!this.canExecute(message, item)) {
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
        return this.formatResult(message, result);
    }
}

module.exports = DiscordDatabaseCommand;
