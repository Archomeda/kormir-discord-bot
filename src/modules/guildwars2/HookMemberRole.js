'use strict';

const DiscordHook = require('../DiscordHook');


class HookMemberRole extends DiscordHook {
    constructor(module) {
        super(module);
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
