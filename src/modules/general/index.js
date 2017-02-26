'use strict';

const
    Module = require('../Module'),
    CommandHelp = require('./CommandHelp'),
    CommandSource = require('./CommandSource');

class ModuleGeneral extends Module {
    constructor(bot, moduleConfig) {
        super(bot, moduleConfig);

        this.registerCommand(new CommandHelp(this));
        this.registerCommand(new CommandSource(this));
    }
}

module.exports = ModuleGeneral;
