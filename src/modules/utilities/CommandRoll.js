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
                new CommandParam('input', i18next.t('utilities:roll.param-input', { max_dice: this.config.get('max_dice'), max_faces: this.config.get('max_faces') }), true, undefined, true)
            ];
        });
    }

    onCommand(response) {
        const request = response.request;
        const dieMatch = request.params.input ? request.params.input.match(/^(\d*)d(\d*)(?:([+-]\d+))?$/) : [];
        if (!dieMatch) {
            throw new CommandError(i18next.t('utilities:roll.response-invalid-input'));
        }

        const dice = dieMatch[1] || 1;
        const faces = dieMatch[2] || 6;
        const transformation = dieMatch[3] ? parseInt(dieMatch[3], 10) : 0;

        const max_dice = this.config.get('max_dice');
        const max_faces = this.config.get('max_faces');
        if (dice < 1 || dice > max_dice) {
            throw new CommandError(i18next.t('utilities:roll.response-dice-out-of-range', { max: max_dice }));
        }
        if (faces < 2 || faces > max_faces) {
            throw new CommandError(i18next.t('utilities:roll.response-faces-out-of-range', { max: max_faces }));
        }

        const result = {
            rolls: random.dice(faces, dice),
            transformation
        };

        const generateSymbols = index => {
            const black = '◾';
            const white = '◽';
            return (
                `${index % 4 === 0 ? black : white} ` +
                `${index % 4 === 1 || index % 4 === 3 ? black : white} ` +
                `${index % 4 === 2 ? black : white}`
            );
        };

        // TODO: Need to find a better way of doing this
        request.message.channel.sendMessage(i18next.t('utilities:roll.response-rolling', {
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
                    const total = result.rolls.reduce((a, b) => a + b, 0);
                    const rolls = result.rolls.length === 1 ? `**${result.rolls[0]}**` : `${result.rolls.join(' + ')} = **${total}**`;

                    let text;
                    if (!result.transformation) {
                        text = i18next.t('utilities:roll.response-normal', {
                            user: receiver.toString(),
                            rolls
                        });
                    } else {
                        text = i18next.t('utilities:roll.response-transformation', {
                            user: receiver.toString(),
                            rolls,
                            transformation: `${result.transformation > 0 ? `+${result.transformation}` : result.transformation} = **${total + result.transformation}**`
                        });
                    }
                    message.edit(text);
                }
            })(messageEdit, result, request.message.author, 1);
            setTimeout(update, 600);
        });
    }
}

module.exports = CommandRoll;
