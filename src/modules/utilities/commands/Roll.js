'use strict';

const random = require('random-js')();

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');
const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');
const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');


class CommandRoll extends DiscordCommand {
    constructor(bot) {
        super(bot, 'roll', ['roll :input?'], { routeContext: () => this._getContext() });
        this._localizerNamespaces = 'module.utilities';
    }

    _getContext() {
        const config = this.getModule().getConfig().root(this.getId());
        const maxDice = config.get('max-dice');
        const maxFaces = config.get('max-faces');

        return {
            max_dice: maxDice, // eslint-disable-line camelcase
            max_faces: maxFaces // eslint-disable-line camelcase
        };
    }

    async onCommand(message, parameters) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const config = this.getModule().getConfig().root(this.getId());

        const dieMatch = parameters.input ? parameters.input.match(/^(\d*)d?(\d*)(?:([+-]\d+))?$/) : [];
        if (!dieMatch) {
            throw new DiscordCommandError(l.t('module.utilities:roll.response-invalid-input'));
        }

        const dice = dieMatch[1] || 1;
        const faces = dieMatch[2] || 6;
        const transformation = dieMatch[3] ? parseInt(dieMatch[3], 10) : 0;

        const maxDice = config.get('max-dice');
        const maxFaces = config.get('max-faces');
        if (dice < 1 || dice > maxDice) {
            throw new DiscordCommandError(l.t('module.utilities:roll.response-dice-out-of-range', { max: maxDice }));
        }
        if (faces < 2 || faces > maxFaces) {
            throw new DiscordCommandError(l.t('module.utilities:roll.response-faces-out-of-range', { max: maxFaces }));
        }

        const result = {
            rolls: random.dice(faces, dice),
            transformation
        };
        const generateSymbols = index => {
            const black = '◾';
            const white = '◽';
            return (
                (index % 4 === 0 ? black : white) +
                (index % 4 === 1 ? black : white) +
                (index % 4 === 2 ? black : white)
            );
        };

        return new DiscordReplyMessage(l.t('module.utilities:roll.response-rolling', {
            user: message.author.toString(),
            symbols: generateSymbols(0)
        }), {
            onReplyPosted(response, message) {
                const update = ((message, result, receiver, i) => () => {
                    if (i < 3) {
                        message.edit(l.t('module.utilities:roll.response-rolling', {
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
                            text = l.t('module.utilities:roll.response-normal', {
                                user: receiver.toString(),
                                rolls
                            });
                        } else {
                            text = l.t('module.utilities:roll.response-transformation', {
                                user: receiver.toString(),
                                rolls,
                                transformation: `${result.transformation > 0 ? `+${result.transformation}` : result.transformation} = **${total + result.transformation}**`
                            });
                        }
                        message.edit(text);
                    }
                })(message, result, response.getRequest().getMessage().author, 1);
                setTimeout(update, 600);
            }
        });
    }
}

module.exports = CommandRoll;
