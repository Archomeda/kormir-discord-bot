'use strict';

const Discord = require('discord.js');
const { decode } = require('gw2e-chat-codes');

const DiscordHook = require('../../../../bot/modules/DiscordHook');

const gw2Api = require('../api');


class HookChatCode extends DiscordHook {
    constructor(bot) {
        super(bot, 'chat-code');
        this._hooks = {
            message: this.onMessage.bind(this)
        };
    }

    async onMessage(message) {
        if (message.author.bot) {
            // Ignore bot messages
            return;
        }

        const l = this.getBot().getLocalizer();
        const text = message.content;
        const chatCodes = text.match(/\[&[0-9a-zA-Z/=]+]/g);
        if (!chatCodes) {
            return;
        }

        message.channel.startTyping();

        // TODO: Combine codes of the same type to reduce API calls
        const decodedCodes = (await Promise.all(chatCodes.map(async c => {
            try {
                return await this._decodeChatCode(c);
            } catch (err) { }
        }))).filter(c => c).join('\n');
        const embed = new Discord.RichEmbed().setDescription(decodedCodes);

        message.channel.stopTyping(true);
        return message.channel.send(l.t('module.guildwars2:chat-code.response-message', { user: message.author.toString() }), { embed });
    }

    async _decodeChatCode(chatCode) {
        const decoded = decode(chatCode);
        switch (decoded.type) {
            case 'item':
                return this._decodeItemCode(chatCode, decoded);
            case 'map':
                return this._decodeMapPoiCode(chatCode, decoded);
            case 'skill':
                return this._decodeSkillCode(chatCode, decoded);
            case 'trait':
                return this._decodeTraitCode(chatCode, decoded);
            case 'recipe':
                return this._decodeRecipeCode(chatCode, decoded);
            case 'skin':
                return this._decodeSkinCode(chatCode, decoded);
            case 'outfit':
                return this._decodeOutfitCode(chatCode, decoded);
            case 'objective':
                return this._decodeObjectiveCode(chatCode, decoded);
            default:
                return undefined;
        }
    }

    async _decodeItemCode(chatCode, item) {
        const l = this.getBot().getLocalizer();
        const itemInfo = await gw2Api.items().get(item.id);
        if (itemInfo) {
            return l.t('module.guildwars2:chat-code.response-item', {
                code: chatCode,
                id: itemInfo.id,
                name: itemInfo.name,
                wiki: this._createWikiLink(chatCode)
            });
        }
    }

    async _decodeMapPoiCode(chatCode, poi) {
        const l = this.getBot().getLocalizer();
        // Sadly we have to get the whole floors endpoint
        const continents = await Promise.all([
            gw2Api.continents().floors(1).all(), // Hardcoded Tyria
            gw2Api.continents().floors(2).all() // Hardcoded Mists
        ]);

        const getData = floors => {
            for (const floor of floors) {
                for (const region of Object.values(floor.regions)) {
                    for (const map of Object.values(region.maps)) {
                        if (map.points_of_interest[poi.id]) {
                            return map.points_of_interest[poi.id];
                        }
                    }
                }
            }
        };

        const mapInfo = getData(continents[0]) || getData(continents[1]);
        if (mapInfo) {
            return l.t('module.guildwars2:chat-code.response-map', {
                code: chatCode,
                id: mapInfo.id,
                name: mapInfo.name,
                type: l.t([`module.guildwars2:chat-code.poi-${mapInfo.type}`, 'module.guildwars2:chat-code.poi-unknown']),
                wiki: this._createWikiLink(chatCode)
            });
        }
    }

    async _decodeSkillCode(chatCode, skill) {
        const l = this.getBot().getLocalizer();
        const skillInfo = await gw2Api.skills().get(skill.id);
        if (skillInfo) {
            return l.t('module.guildwars2:chat-code.response-skill', {
                code: chatCode,
                id: skillInfo.id,
                name: skillInfo.name,
                wiki: this._createWikiLink(chatCode)
            });
        }
    }

    async _decodeTraitCode(chatCode, trait) {
        const l = this.getBot().getLocalizer();
        const traitInfo = await gw2Api.traits().get(trait.id);
        if (traitInfo) {
            return l.t('module.guildwars2:chat-code.response-trait', {
                code: chatCode,
                id: traitInfo.id,
                name: traitInfo.name,
                wiki: this._createWikiLink(chatCode)
            });
        }
    }

    async _decodeRecipeCode(chatCode, recipe) {
        const l = this.getBot().getLocalizer();
        const recipeInfo = await gw2Api.recipes().get(recipe.id);
        if (recipeInfo) {
            const itemInfo = await gw2Api.items().get(recipeInfo.output_item_id);
            if (itemInfo) {
                return l.t('module.guildwars2:chat-code.response-recipe', {
                    code: chatCode,
                    id: recipeInfo.id,
                    name: itemInfo.name,
                    wiki: this._createWikiLink(chatCode)
                });
            }
        }
    }

    async _decodeSkinCode(chatCode, skin) {
        const l = this.getBot().getLocalizer();
        const skinInfo = await gw2Api.skins().get(skin.id);
        if (skinInfo) {
            return l.t('module.guildwars2:chat-code.response-skin', {
                code: chatCode,
                id: skinInfo.id,
                name: skinInfo.name,
                wiki: this._createWikiLink(chatCode)
            });
        }
    }

    async _decodeOutfitCode(chatCode, outfit) {
        const l = this.getBot().getLocalizer();
        const outfitInfo = await gw2Api.outfits().get(outfit.id);
        if (outfitInfo) {
            return l.t('module.guildwars2:chat-code.response-outfit', {
                code: chatCode,
                id: outfitInfo.id,
                name: outfitInfo.name,
                wiki: this._createWikiLink(chatCode)
            });
        }
    }

    async _decodeObjectiveCode(chatCode, objective) {
        const l = this.getBot().getLocalizer();
        const objectiveInfo = await gw2Api.wvw().objectives().get(objective.id);
        if (objectiveInfo) {
            return l.t('module.guildwars2:chat-code.response-objective', {
                code: chatCode,
                id: objectiveInfo.id,
                name: objectiveInfo.name,
                wiki: this._createWikiLink(chatCode)
            });
        }
    }

    _createWikiLink(chatCode) {
        return `https://wiki.guildwars2.com/index.php?title=Special:Search&search=${encodeURIComponent(chatCode)}`;
    }
}

module.exports = HookChatCode;
