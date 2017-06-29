'use strict';

const Module = require('../../../bot/modules/Module');
const CommandRegister = require('./commands/Register');
const CommandForceRegister = require('./commands/ForceRegister');
const CommandWiki = require('./commands/Wiki');
const CommandCats = require('./commands/Cats');
const CommandDaily = require('./commands/Daily');
const CommandRaids = require('./commands/Raids');
const CommandSab = require('./commands/Sab');
const CommandQuaggan = require('./commands/Quaggan');
const HookChatCode = require('./hooks/ChatCode');
const HookMemberRole = require('./hooks/GuildMemberRole');
const HookWorldRole = require('./hooks/WorldRole');
const WorkerApiChecker = require('./workers/ApiChecker');
const WorkerGuildLogChecker = require('./workers/GuildLogChecker');
const WorkerBuildChecker = require('./workers/BuildChecker');
const WorkerReleaseNotesChecker = require('./workers/ReleaseNotesChecker');
const WorkerBlogPostChecker = require('./workers/BlogPostChecker');


class ModuleGuildWars2 extends Module {
    constructor(bot) {
        super(bot, 'guildwars2');

        this._onFire = false;

        this.register(new CommandRegister(bot));
        this.register(new CommandForceRegister(bot));
        this.register(new CommandWiki(bot));
        this.register(new CommandCats(bot));
        this.register(new CommandDaily(bot));
        this.register(new CommandRaids(bot));
        this.register(new CommandSab(bot));
        this.register(new CommandQuaggan(bot));
        this.register(new HookChatCode(bot));
        this.register(new HookMemberRole(bot));
        this.register(new HookWorldRole(bot));
        this.register(new WorkerApiChecker(bot));
        this.register(new WorkerGuildLogChecker(bot));
        this.register(new WorkerBuildChecker(bot));
        this.register(new WorkerReleaseNotesChecker(bot));
        this.register(new WorkerBlogPostChecker(bot));
    }

    isApiOnFire(onFire) {
        if (onFire !== undefined) {
            this._onFire = onFire;
        }
        return this._onFire;
    }

    parseApiError(err) {
        const l = this.getBot().getLocalizer();
        if (err.content && err.content.text) {
            return l.t('module.guildwars2:api.response-error', { error: err.content.text });
        }

        if (err.response) {
            // This is an API error
            console.warn(err);
            return l.t('module.guildwars2:api.response-error-unknown');
        }

        throw err;
    }
}

module.exports = ModuleGuildWars2;
