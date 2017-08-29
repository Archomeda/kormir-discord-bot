'use strict';

const Module = require('../../../bot/modules/Module');
const HookHeart = require('./hooks/Heart');


class ModuleUtilities extends Module {
    constructor(bot) {
        super(bot, 'fun');

        this.register(new HookHeart(bot));
    }
}

module.exports = ModuleUtilities;
