'use strict';

const Module = require('../Module');
const CommandExportIds = require('./CommandExportIds');


class ModuleManage extends Module {
    constructor(bot, moduleConfig) {
        super(bot, moduleConfig);

        this.registerCommand(new CommandExportIds(this));
    }
}

module.exports = ModuleManage;
