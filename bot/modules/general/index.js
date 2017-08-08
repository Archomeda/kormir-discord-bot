'use strict';

const Module = require('../../../bot/modules/Module');
const CommandInfo = require('./commands/Info');
const CommandHelp = require('./commands/Help');


class ModuleGeneral extends Module {
    constructor(bot) {
        super(bot, 'general');

        this.register(new CommandInfo(bot));
        this.register(new CommandHelp(bot));
    }
}

module.exports = ModuleGeneral;
