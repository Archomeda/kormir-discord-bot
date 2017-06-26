'use strict';

const Discord = require('discord.js');
const Promise = require('bluebird');

const gw2Api = require('../api');

const Worker = require('../../../../bot/modules/Worker');


const thumbnailUrl = 'https://dviw3bl0enbyw.cloudfront.net/sprites/0000/0041/Frm_ICON_Announcements.jpg';


class WorkerBuildChecker extends Worker {
    constructor(bot) {
        super(bot, 'build-checker');
        this._localizerNamespaces = 'module.guildwars2';
    }

    check() {
        Promise.all([
            this.getLatestBuild(),
            this.checkBuild()
        ]).then(([oldBuild, build]) => {
            if (build !== oldBuild) {
                return this.setLatestBuild(build).then(() => {
                    if (oldBuild) {
                        this.onNewBuild(build);
                    }
                });
            }
        }).catch(err => this.log(`Error while checking for a new build: ${err.message}`, 'error'));
    }

    checkBuild() {
        return gw2Api.build().get().then(build => {
            this.log(`Got live build: ${build}`, 'log');
            return build;
        });
    }

    onNewBuild(build) {
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
            channel.send('', {
                embed: new Discord.RichEmbed()
                    .setColor(config.get('richcolor'))
                    .setThumbnail(thumbnailUrl)
                    .setTitle(l.t('module.guildwars2:build-checker.build-title'))
                    .setDescription(l.t('module.guildwars2:build-checker.build-description', { build: build.toLocaleString() }))
                    .setTimestamp(time)
            });
        }
    }

    getLatestBuild() {
        return this.getBot().getCache().get(this.getId(), 'build');
    }

    setLatestBuild(build) {
        return this.getBot().getCache().set(this.getId(), 'build', undefined, build);
    }


    enableWorker() {
        this._intervalId = setInterval(this.check.bind(this), 300000);
        this.check();
    }

    disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = WorkerBuildChecker;
