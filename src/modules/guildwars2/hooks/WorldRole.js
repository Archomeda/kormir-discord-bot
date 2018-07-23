'use strict';

const _ = require('lodash');

const DiscordHook = require('../../../../bot/modules/DiscordHook');

const models = require('../../../models');

const gw2Api = require('../api');

const CommandRegister = require('../commands/Register');
const CommandForceRegister = require('../commands/ForceRegister');


class HookWorldRole extends DiscordHook {
    constructor(bot) {
        super(bot, 'world-role');

        // We are not checking on ready or on guildMemberAvailable.
        // Reason: It will check every user account individually every reboot otherwise.
        // So instead, we will only check whenever a user gets updated in a guild.
        this._hooks = {
            guildMemberUpdate: this.onUpdate.bind(this),
            presenceUpdate: this.onUpdate.bind(this)
        };
    }

    async ensureWorldMembership(user, gw2Account) {
        const config = this.getConfig();
        if (!config.has('role-ids')) {
            return;
        }

        try {
            if (!gw2Account) {
                gw2Account = await models.Gw2Account.findOne({ discordId: user.id });
            }
            if (!gw2Account) {
                return;
            }

            const accountInfo = await gw2Api.authenticate(gw2Account.apiKey).account().get();
            return await this._applyWorldRoles(user, accountInfo.world);
        } catch (err) {
            if (err.response && err.response.status >= 400 && err.response.status <= 499 && err.content && err.content.text === 'invalid key') {
                // Handle missing API keys
                return this._applyWorldRoles(user, 0);
            }
            this.log(`Error while ensuring world membership for ${user.user ? user.user.tag : user.tag} (${user.id}): ${err.message}`, 'error');
        }
    }

    async _applyWorldRoles(user, world) {
        const roles = this.getConfig().get('role-ids').raw();

        const exec = [];
        if (roles[world] && user.guild.roles.has(roles[world]) && !user.roles.has(roles[world])) {
            exec.push(user.addRole(roles[world]));
        }
        const excluded = Object.values(_.pickBy(roles, (roleId, worldId) => {
            worldId = parseInt(worldId, 10);
            return worldId !== world && user.roles.has(roles[worldId]);
        }));
        if (excluded.length > 0) {
            exec.push(user.removeRoles(excluded));
        }
        return Promise.all(exec);
    }


    async onUpdate(oldMember, newMember) {
        return this.ensureWorldMembership(newMember);
    }

    async onNewRegistration(user, gw2Account) {
        return this.ensureWorldMembership(user, gw2Account);
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

module.exports = HookWorldRole;
