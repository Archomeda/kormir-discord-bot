#!/usr/bin/env node
'use strict';

const Bot = require('./bot/Bot');
const ModuleGuildWars2 = require('./src/modules/guildwars2');
const ModuleSchedule = require('./src/modules/schedule');
const ModuleUtilities = require('./src/modules/utilities');
const ModuleFun = require('./src/modules/fun');

const bot = new Bot();
bot.addModule(ModuleGuildWars2);
bot.addModule(ModuleSchedule);
bot.addModule(ModuleUtilities);
bot.addModule(ModuleFun);

process.on('warning', e => {
    console.warn(`${e.name}: ${e.message}`);
    console.warn(e.stack);
});

(async function () {
    try {
        await bot.start();
    } catch (err) {
        console.error(err.message);
        console.info(err.stack);
        process.exit(err.errno);
    }
})();
