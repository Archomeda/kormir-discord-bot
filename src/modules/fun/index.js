'use strict';

const Module = require('../../../bot/modules/Module');
const HookReact = require('./hooks/React');
const HookRespond = require('./hooks/Respond');


class ModuleUtilities extends Module {
    constructor(bot) {
        super(bot, 'fun');

        this.register(new HookReact(bot));
        this.register(new HookRespond(bot));
    }
}

module.exports = ModuleUtilities;
