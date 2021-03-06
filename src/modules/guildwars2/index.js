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
const CommandWhois = require('./commands/Whois');
const HookChatCode = require('./hooks/ChatCode');
const HookMemberRole = require('./hooks/GuildMemberRole');
const HookWorldRole = require('./hooks/WorldRole');
const WorkerApiChecker = require('./workers/ApiChecker');
const WorkerGuildLogChecker = require('./workers/GuildLogChecker');
const WorkerBuildChecker = require('./workers/BuildChecker');
const WorkerReleaseNotesChecker = require('./workers/ReleaseNotesChecker');
const WorkerBlogPostChecker = require('./workers/BlogPostChecker');
const WorkerAnnouncementChecker = require('./workers/AnnouncementChecker');
const WorkerSoundCloudChecker = require('./workers/SoundCloudChecker');


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
        this.register(new CommandWhois(bot));
        this.register(new HookChatCode(bot));
        this.register(new HookMemberRole(bot));
        this.register(new HookWorldRole(bot));
        this.register(new WorkerApiChecker(bot));
        this.register(new WorkerGuildLogChecker(bot));
        this.register(new WorkerBuildChecker(bot));
        this.register(new WorkerReleaseNotesChecker(bot));
        this.register(new WorkerBlogPostChecker(bot));
        this.register(new WorkerAnnouncementChecker(bot));
        this.register(new WorkerSoundCloudChecker(bot));
    }

    isApiOnFire(onFire) {
        if (onFire !== undefined) {
            this._onFire = onFire;
        }
        return this._onFire;
    }

    _removeApiKeys(text) {
        return text.replace(/access_token=[A-Fa-f0-9-]+/, 'access_token=[REMOVED]');
    }

    parseApiError(err) {
        const l = this.getBot().getLocalizer();
        if (err.content && err.content.text) {
            // TODO: Filter more error types
            if (err.content.text.startsWith('requires scope ')) {
                return l.t('module.guildwars2:api.response-error-permission', { permissions: err.content.text.substr(15) });
            }
            return l.t('module.guildwars2:api.response-error', { error: this._removeApiKeys(err.content.text) });
        }

        if (err.response) {
            // This is an API error
            if (err.response.status >= 400) {
                return l.t('module.guildwars2:api.response-error-status', { status: err.response.status });
            }
            console.warn(err);
            return l.t('module.guildwars2:api.response-error-unknown');
        }

        // This is an unknown error
        err.message = this._removeApiKeys(err.message); // Make sure to remove possible API keys from the message

        throw err;
    }
}

module.exports = ModuleGuildWars2;
