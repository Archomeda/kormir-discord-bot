'use strict';

const Module = require('../Module');
const CommandHelp = require('./CommandHelp');
const CommandInfo = require('./CommandInfo');


class ModuleGeneral extends Module {
    constructor() {
        super();

        this.registerCommand(new CommandHelp(this));
        this.registerCommand(new CommandInfo(this));
    }
}

module.exports = ModuleGeneral;
