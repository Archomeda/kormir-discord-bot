'use strict';

const Discord = require('discord.js');

const gw2Api = require('../api');

const Worker = require('../../../../bot/modules/Worker');


const thumbnailFolder = './resources/';
const thumbnailFile = 'game-update.png';


class WorkerBuildChecker extends Worker {
    constructor(bot) {
        super(bot, 'build-checker');
        this._localizerNamespaces = 'module.guildwars2';
    }

    async check() {
        try {
            const [oldBuild, build] = await Promise.all([
                this.getLatestBuild(),
                this._checkBuild()
            ]);
            if (build !== oldBuild) {
                await this.setLatestBuild(build);
                if (oldBuild) {
                    await this.onNewBuild(build);
                }
            }
        } catch (err) {
            this.log(`Error while checking for a new build: ${err.message}`, 'error');
        }
    }

    async _checkBuild() {
        const build = await gw2Api.build().get();
        this.log(`Got live build: ${build}`, 'log');
        return build;
    }

    async onNewBuild(build) {
        const bot = this.getBot();
        const config = this.getModule().getConfig().root(this.getId());
        const client = bot.getClient();
        const l = bot.getLocalizer();

        const time = new Date();
        this.log(`New build: ${build}`);
        this.emit('new-build', { build, time });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            return channel.send('', {
                embed: new Discord.RichEmbed()
                    .setColor(config.get('richcolor'))
                    .attachFile(`${thumbnailFolder}${thumbnailFile}`)
                    .setThumbnail(`attachment://${thumbnailFile}`)
                    .setTitle(l.t('module.guildwars2:build-checker.build-title'))
                    .setDescription(l.t('module.guildwars2:build-checker.build-description', { build: build.toLocaleString() }))
                    .setTimestamp(time)
            });
        }

        this.log(`Invalid channel ${channelId}`, 'error');
    }

    async getLatestBuild() {
        return this.getBot().getCache().get(this.getId(), 'build');
    }

    async setLatestBuild(build) {
        return this.getBot().getCache().set(this.getId(), 'build', undefined, build);
    }


    async enableWorker() {
        this._intervalId = setInterval(this.check.bind(this), 300000);
        setTimeout(this.check.bind(this), 1000);
    }

    async disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = WorkerBuildChecker;
