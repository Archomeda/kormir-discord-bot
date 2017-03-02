'use strict';

const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));
const random = require('random-js')();

const Command = require('../Command');
const CommandParam = require('../CommandParam');
const CommandError = require('../../errors/CommandError');


class CommandRoll extends Command {
    constructor(module) {
        super(module);

        i18next.loadNamespacesAsync('utilities').then(() => {
            this.helpText = i18next.t('utilities:roll.help');
            this.shortHelpText = i18next.t('utilities:roll.short-help');
            this.params = [
                new CommandParam('die', i18next.t('utilities:roll.param-die'), true),
                new CommandParam('rolls', i18next.t('utilities:roll.param-rolls'), true)
            ];
        });
    }

    onCommand(response) {
        const request = response.request;
        let die = (request.params.die && parseInt(request.params.die, 10)) || 6;
        let rolls = (request.params.rolls && parseInt(request.params.rolls, 10)) || 1;

        if (!die || die < 2 || die > this.config.roll_max_die) {
            throw new CommandError(i18next.t('utilities:roll.response-die-out-of-range'));
        }
        if (!rolls || rolls < 1 || rolls > this.config.roll_max_rolls) {
            throw new CommandError(i18next.t('utilities:roll.response-rolls-out-of-range'));
        }

        const result = random.dice(die, rolls);

        const generateSymbols = index => {
            const black = '◾';
            const white = '◽';
            return (
                `${index % 4 === 0 ? black : white} ` +
                `${index % 4 === 1 || index % 4 === 3 ? black : white} ` +
                `${index % 4 === 2 ? black : white}`
            );
        };

        return request.message.channel.sendMessage(i18next.t('utilities:roll.response-rolling', {
            user: request.message.author.toString(),
            symbols: generateSymbols(0)
        })).then(messageEdit => {
            const update = ((message, result, receiver, i) => () => {
                if (i < 5) {
                    message.edit(i18next.t('utilities:roll.response-rolling', {
                        user: receiver.toString(),
                        symbols: generateSymbols(i)
                    }));
                    setTimeout(update, 600);
                    i++;
                } else {
                    message.edit(i18next.t('utilities:roll.response', {
                        user: receiver.toString(),
                        result: result.join(', ')
                    }));
                }
            })(messageEdit, result, request.message.author, 1);
            setTimeout(update, 600);
        });
    }
}

module.exports = CommandRoll;
