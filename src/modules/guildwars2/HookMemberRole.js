'use strict';

const
    i18next = require('i18next'),

    DiscordHook = require('../DiscordHook');

class HookMemberRole extends DiscordHook {
    constructor(module) {
        super(module);
        i18next.loadNamespaces('guildwars2');

        this._hooks = {
            guildMemberUpdate: this.onGuildMemberUpdate,
            presenceUpdate: this.onPresenceUpdate
        };
    }

    onGuildMemberUpdate(oldMember, newMember) {
        this.module.ensureGuildMembership(newMember);
    }

    onPresenceUpdate(oldMember, newMember) {
        this.module.ensureGuildMembership(newMember);
    }
}

module.exports = HookMemberRole;
