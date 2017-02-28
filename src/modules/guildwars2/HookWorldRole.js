'use strict';

const DiscordHook = require('../DiscordHook');


class HookWorldRole extends DiscordHook {
    constructor(module) {
        super(module);
        this._hooks = {
            guildMemberUpdate: this.onGuildMemberUpdate,
            presenceUpdate: this.onPresenceUpdate
        };
    }

    onGuildMemberUpdate(oldMember, newMember) {
        this.module.ensureWorldMembership(newMember);
    }

    onPresenceUpdate(oldMember, newMember) {
        this.module.ensureWorldMembership(newMember);
    }
}

module.exports = HookWorldRole;
