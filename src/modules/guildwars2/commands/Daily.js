'use strict';

const Discord = require('discord.js');
const moment = require('moment-timezone');

const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const ApiBase = require('./ApiBase');


const dailyThumbnail = 'https://render.guildwars2.com/file/483E3939D1A7010BDEA2970FB27703CAAD5FBB0F/42684.png';


class CommandDaily extends ApiBase {
    constructor(bot) {
        super(bot, 'daily', ['daily']);
    }

    async onApiCommand(request, gw2Api) {
        const bot = this.getBot();
        const l = bot.getLocalizer();

        const nextReset = moment().utc().hour(0).minute(0).seconds(0);
        if (nextReset.isBefore(moment())) {
            nextReset.add(1, 'd');
        }
        const timeRemaining = moment.duration(nextReset.unix() - moment().unix(), 's');
        const embed = new Discord.RichEmbed()
            .setTitle(l.t('module.guildwars2:daily.response-title'))
            .setDescription(l.t('module.guildwars2:daily.response-description', { timeleft: timeRemaining.humanize() }))
            .setThumbnail(dailyThumbnail);

        const daily = await gw2Api.achievements().daily().get();
        const filterLvl80 = d => d.level.max === 80;
        let allIds = [];
        for (const category of Object.keys(daily)) {
            allIds = allIds.concat(daily[category].filter(filterLvl80).map(d => d.id));
        }

        const achievements = gw2Api.byId(await gw2Api.achievements().many(allIds));
        for (const category of Object.keys(daily)) {
            const categoryOutput = this._formatCategory(category, daily, achievements);
            if (categoryOutput) {
                embed.addField(categoryOutput.title, categoryOutput.description);
            }
        }

        return new DiscordReplyMessage('', { embed });
    }

    _filterLevel80(dailyCategory) {
        return dailyCategory.filter(d => d.level.max === 80);
    }

    _formatCategory(categoryId, daily, achievements) {
        const l = this.getBot().getLocalizer();
        const title = l.t([`module.guildwars2:daily.category-${categoryId}`, 'module.guildwars2:daily.category-unknown'], { category: categoryId });
        const result = [...new Set(this._filterLevel80(daily[categoryId]).map(a => this._formatAchievement(categoryId, a, achievements))).values()];
        if (result.length > 0) {
            return { title, description: result.join('\n') };
        }
        return undefined;
    }

    _formatAchievement(categoryId, dailyAchievement, achievements) {
        const l = this.getBot().getLocalizer();
        const longName = achievements.has(dailyAchievement.id) ? achievements.get(dailyAchievement.id).name : l.t('module.guildwars2:daily.achievement-unknown', { id: dailyAchievement.id });
        const regex = new RegExp(l.t([`module.guildwars2:daily.${categoryId}-regex`, 'module.guildwars2:daily.daily-regex']), 'i');
        let name = longName.match(regex);
        if (name) {
            name = name.slice(1).find(n => n !== undefined);
        } else {
            name = longName;
        }
        const access = dailyAchievement.required_access.map(a => l.t([`module.guildwars2:daily.access-${a}`, 'module.guildwars2:daily.access-unknown'], { access: a })).join(', ');
        return l.t('module.guildwars2:daily.response-achievement', { name, access });
    }
}

module.exports = CommandDaily;
