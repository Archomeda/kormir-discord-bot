'use strict';

const Activity = require('./Activity');
const DiscordCommand = require('./DiscordCommand');
const DiscordCommandRequest = require('./DiscordCommandRequest');
const DiscordCommandResponse = require('./DiscordCommandResponse');
const DiscordHook = require('./DiscordHook');
const DiscordReplyMessage = require('./DiscordReplyMessage');
const Hook = require('./Hook');
const Module = require('./Module');
const Worker = require('./Worker');

const ModuleGeneral = require('./general');

module.exports = {
    Activity,
    DiscordCommand,
    DiscordCommandRequest,
    DiscordCommandResponse,
    DiscordHook,
    DiscordReplyMessage,
    Hook,
    Module,
    Worker,

    modules: {
        General: ModuleGeneral
    }
};
