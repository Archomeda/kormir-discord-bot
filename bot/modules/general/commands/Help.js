'use strict';

const AutoRemoveMessage = require('../../../middleware/AutoRemoveMessage');

const DiscordCommandError = require('../../../modules/DiscordCommandError');
const DiscordCommandParameter = require('../../../modules/DiscordCommandParameter');
const DiscordCommand = require('../../../modules/DiscordCommand');


class CommandHelp extends DiscordCommand {
    constructor(bot) {
        super(bot, 'help', ['help']);
        this._localizerNamespaces = 'module.general';

        this.setMiddleware(new AutoRemoveMessage(bot, this, { defaultRequest: 300, defaultResponse: 300 })); // Auto remove messages after 5 minutes
    }

    initializeParameters() {
        return new DiscordCommandParameter('command', { optional: true });
    }

    async onCommand(request) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const modules = bot._modules;
        const commandPrefix = bot.getConfig().get('discord.commands.prefix');
        const helpCommand = this.getCommandTrigger();
        const params = request.getParams();

        if (params.command) {
            // Reply with help for a specific command
            const commandTrigger = params.command.replace(new RegExp(`^${commandPrefix}?(.*)$`), '$1').toLowerCase();
            let command;
            for (const module of modules) {
                const commands = module.getActivities().filter(a => a instanceof DiscordCommand && a.isEnabled());
                const foundCommand = commands.find(command => command.getTriggers().includes(commandTrigger));
                if (foundCommand) {
                    command = foundCommand;
                    break;
                }
            }

            if (!command) {
                throw new DiscordCommandError(l.t('module.general:help.response-command-not-recognized', { command: commandTrigger, help: helpCommand }));
            } else if (!command.isCommandAllowed(request.getMessage().author)) {
                throw new DiscordCommandError(l.t('module.general:help.response-command-not-allowed', { command: commandTrigger, help: helpCommand }));
            }
            return l.t('module.general:help.response-single-help', { help: this._formatCommandHelp(request.getMessage(), command) });
        }

        // Reply with general help
        const help = [];
        modules.forEach(module => {
            const moduleHelp = this._formatModuleHelp(request.getMessage(), module);
            if (moduleHelp) {
                help.push(moduleHelp);
            }
        });
        return l.t('module.general:help.response-all-help', { list: help.join('\n\n'), help: helpCommand });
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
            if (!command.isCommandAllowed(message.author)) {
                // User has no access to this command, skip
                return;
            }

            const trigger = command.getCommandTrigger();
            if (!trigger) {
                // The command has no triggers, skip
                return;
            }

            const help = l.t(`module.${module.getId()}:${command.getId()}._meta.short-description`);
            if (!help) {
                return;
            }

            commands.push(l.t('module.general:help.module-command-help', { command: `\`${trigger}\``, help }));
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
        const commandPrefix = bot.getConfig().get('discord.commands.prefix');

        let invocation = `${commandPrefix}${command.getTriggers()[0]}`;
        const params = [];

        command.getParameters().forEach(param => {
            const paramText = `\`${param.id}\``;
            const helpText = l.t(`module.${command.getModule().getId()}:${command.getId()}._meta.param-${param.id}`, param.localizationContext);
            const extraText = param.optional ? l.t('module.general:help.command-param-restriction-optional') : '';

            if (extraText) {
                params.push(l.t('module.general:help.command-param-help-extra', { param: paramText, help: helpText, extra: extraText }));
            } else {
                params.push(l.t('module.general:help.command-param-help', { param: paramText, help: helpText }));
            }
            invocation += ' ' + (param.optional ? l.t('module.general:help.command-param-optional-format', { param: param.id }) : param.id);
        });

        return l.t('module.general:help.command-help', { command: invocation, help: l.t(`module.${command.getModule().getId()}:${command.getId()}._meta.long-description`), params: params.join('\n') });
    }
}

module.exports = CommandHelp;
