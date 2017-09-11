'use strict';

const { EMBED_DESCRIPTION_CHARACTER_LENGTH } = require('../../../Constants');

const AutoRemoveMessage = require('../../../middleware/AutoRemoveMessage');

const DiscordCommandError = require('../../../modules/DiscordCommandError');
const DiscordCommand = require('../../../modules/DiscordCommand');
const DiscordReplyMessage = require('../../../modules/DiscordReplyMessage');
const DiscordReplyPage = require('../../../modules/DiscordReplyPage');

const { splitMax } = require('../../../utils/String');


class CommandHelp extends DiscordCommand {
    constructor(bot) {
        super(bot, 'help', ['help :command?']);
        this._localizerNamespaces = 'module.general';

        this.setMiddleware(new AutoRemoveMessage(bot, this, { defaultRequest: 300, defaultResponse: 300 })); // Auto remove messages after 5 minutes
    }

    async onCommand(message, parameters) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const modules = bot.getModules();
        const helpInvocation = this.getCommandRoute().getInvocation();

        if (parameters.command) {
            // Reply with help for a specific command
            let command;
            for (const module of modules) {
                const commands = module.getActivities().filter(a => a instanceof DiscordCommand && a.isEnabled());
                const foundCommand = commands.find(command => {
                    const routes = command.getRoutes();
                    return routes.length > 0 ? routes[0].getStrippedInvocation().toLowerCase() === parameters.command.toLowerCase() : false;
                });
                if (foundCommand) {
                    command = foundCommand;
                    break;
                }
            }

            if (!command) {
                throw new DiscordCommandError(l.t('module.general:help.response-command-not-recognized', { command: parameters.command, help: helpInvocation }));
            } else if (!command.isCommandAllowed(message.member || message.author)) {
                throw new DiscordCommandError(l.t('module.general:help.response-command-not-allowed', { command: parameters.command, help: helpInvocation }));
            }
            return l.t('module.general:help.response-single-help', { help: this._formatCommandHelp(message, command) });
        }

        // Reply with general help
        let help = [];
        modules.forEach(module => {
            const moduleHelp = this._formatModuleHelp(message, module);
            if (moduleHelp) {
                help.push(moduleHelp);
            }
        });
        help = help.join('\n\n');

        const helpLength = l.t('module.general:help.response-all-help-paged').length;
        if (help.length > EMBED_DESCRIPTION_CHARACTER_LENGTH - helpLength) {
            help = splitMax(help, '\n', EMBED_DESCRIPTION_CHARACTER_LENGTH - helpLength);
            help = help.map((h, i) => {
                return new DiscordReplyPage(l.t('module.general:help.response-all-help-paged', {
                    list: h,
                    help: helpInvocation,
                    current_page: i + 1, // eslint-disable-line camelcase
                    total_pages: help.length // eslint-disable-line camelcase
                }));
            });
            return new DiscordReplyMessage(help);
        }

        return l.t('module.general:help.response-all-help', { list: help, help: helpInvocation });
    }

    /**
     * Formats a help message for a module.
     * @param {Message} message - The Discord message.
     * @param {Module} module - The module.
     * @returns {string|undefined} The formatted help message; or undefined if no help message exists.
     * @private
     */
    _formatModuleHelp(message, module) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const commands = [];

        module.getActivities().filter(a => a instanceof DiscordCommand && a.isEnabled()).forEach(command => {
            if (!command.isCommandAllowed(message.member || message.author)) {
                // User has no access to this command, skip
                return;
            }

            const route = command.getCommandRoute();
            if (!route) {
                // The command has no route, skip
                return;
            }

            const help = l.t(`module.${module.getId()}:${command.getId()}._meta.short-description`);
            if (!help) {
                return;
            }

            commands.push(l.t('module.general:help.module-command-help', { command: `\`${route.getInvocation()}\``, help }));
        });

        if (commands.length === 0) {
            return;
        }
        return l.t('module.general:help.module-help', { name: l.t(`module.${module.getId()}:_meta.name`), commands: commands.join('\n') });
    }

    /**
     * Formats a help message for a command.
     * @param {Message} message - The Discord message.
     * @param {DiscordCommand} command - The Discord command.
     * @returns {string} The formatted help message.
     * @private
     */
    _formatCommandHelp(message, command) {
        const bot = this.getBot();
        const l = bot.getLocalizer();

        const route = command.getRoutes()[0];
        let invocation = route.getInvocation();
        const params = [];

        route.getParameters().forEach(param => {
            const paramText = `\`${param.getId()}\``;
            const helpText = l.t(`module.${command.getModule().getId()}:${command.getId()}._meta.param-${param.getId()}`, param.getContext());
            const extraText = param.isOptional() ? l.t('module.general:help.command-param-restriction-optional') : '';

            if (extraText) {
                params.push(l.t('module.general:help.command-param-help-extra', { param: paramText, help: helpText, extra: extraText }));
            } else {
                params.push(l.t('module.general:help.command-param-help', { param: paramText, help: helpText }));
            }
            invocation += ' ' + (l.t(param.isOptional() ? 'module.general:help.command-param-optional-format' : 'module.general:help.command-param-required-format', { param: param.getId() }));
        });

        return l.t('module.general:help.command-help', { command: invocation, help: l.t(`module.${command.getModule().getId()}:${command.getId()}._meta.long-description`), params: params.join('\n') });
    }
}

module.exports = CommandHelp;
