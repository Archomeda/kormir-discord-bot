'use strict';

const Module = require('../../../bot/modules/Module');
const CommandRoll = require('./commands/Roll');


class ModuleUtilities extends Module {
    constructor(bot) {
        super(bot, 'utilities');

        this.register(new CommandRoll(bot));
    }
}

module.exports = ModuleUtilities;
