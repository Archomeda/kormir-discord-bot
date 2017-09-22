'use strict';

const moment = require('moment-timezone');

const Worker = require('../../../../bot/modules/Worker');


const pofReleaseDate = moment.utc([2017, 8, 22, 16]); // 22 September, 16:00 UTC

class WorkerPofNicknameCountdown extends Worker {
    constructor(bot) {
        super(bot, 'pof-nickname-countdown');
        this._localizerNamespaces = 'module.guildwars2';
        this._done = false;
    }

    async checkNickname() {
        if (this._done) {
            return;
        }

        const bot = this.getBot();
        const client = bot.getClient();
        const l = bot.getLocalizer();

        const dayDiff = pofReleaseDate.diff(moment(), 'days', true);
        let nickname = '';
        let presence = '';

        if (dayDiff >= -7) {
            if (dayDiff < 0) {
                presence = l.t('module.guildwars2:pof-nickname-countdown.presence-pof'); // eslint-disable-line camelcase
            } else if (dayDiff < 1) {
                const hourDiff = Math.floor(dayDiff * 24);
                presence = l.t('module.guildwars2:pof-nickname-countdown.presence-countdown-hours', {
                    hours_left: hourDiff === 0 ? '<1' : hourDiff // eslint-disable-line camelcase
                });
            } else {
                const hourDiff = (dayDiff - Math.floor(dayDiff)) * 24;
                presence = l.t('module.guildwars2:pof-nickname-countdown.presence-countdown-days', {
                    days_left: Math.floor(dayDiff), // eslint-disable-line camelcase
                    hours_left: Math.floor(hourDiff) // eslint-disable-line camelcase
                });
            }
        }

        if (dayDiff >= 0) {
            const diff = pofReleaseDate.clone().endOf('day').diff(moment(), 'days');
            const word = l.t(`module.guildwars2:pof-nickname-countdown.day-${diff}`);
            nickname = this.getConfig().get('nickname').replace('{{number}}', word);
        }

        this.log(`Setting own nickname to '${nickname}' and game to '${presence}'`);

        for (const guild of client.guilds.values()) {
            const member = await guild.fetchMember(client.user); // eslint-disable-line no-await-in-loop
            if (member !== null) {
                await member.setNickname(nickname); // eslint-disable-line no-await-in-loop
            }
        }
        await client.user.setGame(presence);

        if (!nickname && !presence) {
            this._done = true;
        }
    }

    async enableWorker() {
        this._intervalId = setInterval(this.checkNickname.bind(this), 60 * 60 * 1000); // Every hour
        setTimeout(this.checkNickname.bind(this), 1000);
    }

    async disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = WorkerPofNicknameCountdown;
