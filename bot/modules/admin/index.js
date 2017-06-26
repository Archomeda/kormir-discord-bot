'use strict';

const Module = require('../../../bot/modules/Module');
const CommandExportIds = require('./commands/ExportIds');


class ModuleAdmin extends Module {
    constructor(bot) {
        super(bot, 'admin');

        this.register(new CommandExportIds(bot));
    }
}

module.exports = ModuleAdmin;
