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

    async ensureGuildMembership(user, gw2Account) {
        const client = this.getBot().getClient();
        const moduleConfig = this.getModule().getConfig();
        const config = this.getConfig();
        if (!config.has('role-id')) {
            return;
        }

        const key = moduleConfig.get('guild-leader-api-key');
        const guildId = moduleConfig.get('guild-id');

        try {
            if (!gw2Account) {
                gw2Account = await models.Gw2Account.findOne({ discordId: user.id });
            }
            if (!gw2Account) {
                return;
            }

            // This method relies on a universal guild across one or more discord servers
            // Might have to change that at some point

            const members = await gw2Api.authenticate(key).guild(guildId).members().get();
            const member = members.find(member => member.name === gw2Account.accountName);
            if (user.guild) {
                // Guild member instance
                return member ? await this._addToGuildRole(user) : await this._removeFromGuildRole(user);
            }

            // Just a generic user, convert it to all known guild users
            const exec = client.guilds
                .map(server => server.member(user))
                .filter(u => u)
                .map(user => member ? this._addToGuildRole(user) : this._removeFromGuildRole(user));
            return await Promise.all(exec);
        } catch (err) {
            this.log(`Error while ensuring guild membership for ${user.user ? user.user.tag : user.tag} (${user.id}): ${err.message}`, 'error');
        }
    }

    async _addToGuildRole(user) {
        const role = this.getConfig().get('role-id');
        if (user.guild.roles.has(role) && !user.roles.has(role)) {
            return user.addRole(role);
        }
    }

    async _removeFromGuildRole(user) {
        const role = this.getConfig().get('role-id');
        if (user.roles.has(role)) {
            return user.removeRole(role);
        }
    }


    async onUpdate(oldMember, newMember) {
        return this.ensureGuildMembership(newMember);
    }

    async onNewRegistration(user, gw2Account) {
        return this.ensureGuildMembership(user, gw2Account);
    }


    async enableHook() {
        await super.enableHook();
        const module = this.getModule();
        module.getActivity(CommandRegister).on('new-registration', this.onNewRegistration.bind(this));
        module.getActivity(CommandForceRegister).on('new-registration', this.onNewRegistration.bind(this));
    }

    async disableHook() {
        const module = this.getModule();
        module.getActivity(CommandRegister).removeListener('new-registration', this.onNewRegistration.bind(this));
        module.getActivity(CommandForceRegister).removeListener('new-registration', this.onNewRegistration.bind(this));
        return super.disableHook();
    }
}

module.exports = HookGuildMemberRole;
