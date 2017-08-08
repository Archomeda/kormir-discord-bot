'use strict';

const moment = require('moment-timezone');

const Worker = require('../../../../bot/modules/Worker');


const pofReleaseDate = moment([2017, 8, 22]); // 22 September

class WorkerPofNicknameCountdown extends Worker {
    constructor(bot) {
        super(bot, 'pof-nickname-countdown');
        this._localizerNamespaces = 'module.guildwars2';
    }

    async checkNickname() {
        const bot = this.getBot();
        const client = bot.getClient();
        const l = bot.getLocalizer();

        const oldNickname = this._nickname;
        let nickname = this.getConfig().get('nickname');

        let diff = pofReleaseDate.diff(moment(), 'days') + 1;
        if (diff < 7) {
            // Reset the nickname
            nickname = '';
        } else if (diff < 0) {
            // Force the diff to set on 0
            diff = 0;
        }

        if (diff >= 0) {
            const word = l.t(`module.guildwars2:pof-nickname-countdown.day-${diff}`);
            nickname = nickname.replace('{{number}}', word);
        }

        if (oldNickname === nickname) {
            // Nothing to change
            return;
        }

        this._nickname = nickname;
        this.log(`Setting own nickname to '${nickname}'`);

        for (const guild of client.guilds.values()) {
            const member = await guild.fetchMember(client.user); // eslint-disable-line no-await-in-loop
            if (member !== null) {
                await member.setNickname(nickname); // eslint-disable-line no-await-in-loop
            }
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
