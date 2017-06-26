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

    ensureWorldMembership(user, gw2Account) {
        const config = this.getModule().getConfig().root(this.getId());
        if (!config.has('role-ids')) {
            return;
        }

        const doEnsure = account => gw2Api.authenticate(account.apiKey).account().get().then(accountInfo => {
            return this._applyWorldRoles(user, accountInfo.world);
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

    _applyWorldRoles(user, world) {
        const roles = this.getModule().getConfig().root(this.getId()).get('role-ids').raw();

        const exec = [];
        if (roles[world] && !user.roles.has(roles[world])) {
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


    onUpdate(oldMember, newMember) {
        this.ensureWorldMembership(newMember);
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

module.exports = HookWorldRole;
