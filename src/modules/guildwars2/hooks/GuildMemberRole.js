'use strict';

const DiscordHook = require('../../../../bot/modules/DiscordHook');

const models = require('../../../models');

const gw2Api = require('../api');

const CommandRegister = require('../commands/Register');
const CommandForceRegister = require('../commands/ForceRegister');


class HookGuildMemberRole extends DiscordHook {
    constructor(bot) {
        super(bot, 'guild-member-role');

        // We are not checking on ready or on guildMemberAvailable.
        // Reason: It will check every user account individually every reboot otherwise.
        // So instead, we will only check whenever a user gets updated in a guild.
        this._hooks = {
            guildMemberUpdate: this.onUpdate.bind(this),
            presenceUpdate: this.onUpdate.bind(this)
        };
    }

    ensureGuildMembership(user, gw2Account) {
        const client = this.getBot().getClient();
        const moduleConfig = this.getModule().getConfig();
        const config = moduleConfig.root(this.getId());
        if (!config.has('role-id')) {
            return;
        }

        const key = moduleConfig.get('guild-leader-api-key');
        const guildId = moduleConfig.get('guild-id');

        const doEnsure = account => gw2Api.authenticate(key).guild(guildId).members().get().then(members => {
            const member = members.find(member => member.name === account.accountName);
            if (user.guild) {
                // Guild member instance
                return member ? this._addToGuildRole(user) : this._removeFromGuildRole(user);
            }

            // Just a generic user, convert it to all known guild users
            const exec = client.guilds
                .map(server => server.member(user))
                .filter(u => u)
                .map(user => member ? this._addToGuildRole(user) : this._removeFromGuildRole(user));
            return Promise.all(exec);
        });

        if (!gw2Account) {
            return models.Gw2Account.findOne({ discordId: user.id }).then(account => {
                if (account) {
                    return doEnsure(account);
                }
            });
        }
        return doEnsure(gw2Account);
    }

    _addToGuildRole(user) {
        const role = this.getModule().getConfig().root(this.getId()).get('role-id');
        if (!user.roles.has(role)) {
            return user.addRole(role);
        }
    }

    _removeFromGuildRole(user) {
        const role = this.getModule().getConfig().root(this.getId()).get('role-id');
        if (user.roles.has(role)) {
            return user.removeRole(role);
        }
    }


    onUpdate(oldMember, newMember) {
        this.ensureGuildMembership(newMember);
    }

    onNewRegistration(user, gw2Account) {
        this.ensureGuildMembership(user, gw2Account);
    }


    enableHook() {
        super.enableHook();
        const module = this.getModule();
        module.getActivity(CommandRegister).on('new-registration', this.onNewRegistration.bind(this));
        module.getActivity(CommandForceRegister).on('new-registration', this.onNewRegistration.bind(this));
    }

    disableHook() {
        const module = this.getModule();
        module.getActivity(CommandRegister).removeListener('new-registration', this.onNewRegistration.bind(this));
        module.getActivity(CommandForceRegister).removeListener('new-registration', this.onNewRegistration.bind(this));
        super.disableHook();
    }
}

module.exports = HookGuildMemberRole;
