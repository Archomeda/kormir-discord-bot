'use strict';

const Module = require('../../../bot/modules/Module');
const HookHeart = require('./hooks/Heart');
const HookQuality = require('./hooks/Quality');


class ModuleUtilities extends Module {
    constructor(bot) {
        super(bot, 'fun');

        this.register(new HookHeart(bot));
        this.register(new HookQuality(bot));
    }
}

module.exports = ModuleUtilities;
