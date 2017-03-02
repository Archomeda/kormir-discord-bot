'use strict';

const Module = require('../Module');
const CommandRoll = require('./CommandRoll');


class ModuleUtilities extends Module {
    constructor() {
        super();

        this.registerCommand(new CommandRoll(this));
    }
}

module.exports = ModuleUtilities;
