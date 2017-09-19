'use strict';

const { promisify } = require('util');

const Discord = require('discord.js');
const soundcloud = require('soundcloud-node-api');

const Worker = require('../../../../bot/modules/Worker');


const thumbnailFolder = './resources/';
const thumbnailFile = 'soundcloud.png';
const soundcloudUserId = 30682376;


class WorkerSoundCloudChecker extends Worker {
    constructor(bot) {
        super(bot, 'soundcloud-checker');
        this._localizerNamespaces = 'module.guildwars2';
    }

    async check() {
        try {
            const [oldTrackId, tracks] = await Promise.all([
                this.getLatestTrack(),
                this._checkTracks()
            ]);

            if (!tracks) {
                return;
            }

            const allTracks = [];
            for (let i = 0; i < tracks.length; i++) {
                if (tracks[i].id === oldTrackId) {
                    break;
                }
                allTracks.push(tracks[i]);
            }

            if (allTracks.length > 0) {
                // Set the latest track to the newest track
                await this.setLatestTrack(allTracks[0].id);
                if (oldTrackId) {
                    // Signal all new tracks, in reversed order
                    for (let i = allTracks.length - 1; i >= 0; i--) {
                        await this.onNewTrack(allTracks[i]); // eslint-disable-line no-await-in-loop
                    }
                }
            }
        } catch (err) {
            this.log(`Error while checking for new SoundCloud tracks: ${err.message}`, 'error');
        }
    }

    async _checkTracks() {
        const config = this.getConfig();
        const token = config.get('/soundcloud.token');
        const api = soundcloud(token);
        api.user.getUserTracksAsync = promisify(api.user.getUserTracks);

        const tracks = await api.user.getUserTracksAsync(soundcloudUserId);
        this.log(`Got ${tracks.length} tracks`, 'log');
        return tracks;
    }

    async onNewTrack(track) {
        const bot = this.getBot();
        const config = this.getConfig();
        const client = bot.getClient();
        const l = bot.getLocalizer();

        const time = new Date();
        this.log(`New track: ${track.permalink_url}`);
        this.emit('new-track', { track, time });

        const token = config.get('/soundcloud.token');
        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            await channel.send('', {
                embed: new Discord.RichEmbed()
                    .setColor(config.get('richcolor'))
                    .attachFile(`${thumbnailFolder}${thumbnailFile}`)
                    .setThumbnail(`attachment://${thumbnailFile}`)
                    .setURL(track.permalink_url)
                    .setTitle(l.t('module.guildwars2:soundcloud-checker.track-title', { title: track.title }))
                    .setDescription(l.t(`module.guildwars2:soundcloud-checker.track-description${track.downloadable ? '-downloadable' : ''}`, {
                        title: track.title,
                        description: track.description,
                        url: track.permalink_url,
                        download: `${track.download_url}?client_id=${token}`
                    }))
                    .setTimestamp(new Date(track.created_at))
            });
            return channel.send(l.t('module.guildwars2:soundcloud-checker.track-player', { title: track.title, url: track.permalink_url }));
        }

        this.log(`Invalid channel ${channelId}`, 'error');
    }

    getLatestTrack() {
        return this.getBot().getCache().get(this.getId(), 'track');
    }

    setLatestTrack(track) {
        return this.getBot().getCache().set(this.getId(), 'track', undefined, track);
    }


    async enableWorker() {
        this._intervalId = setInterval(this.check.bind(this), 4 * 60 * 60 * 1000);
        setTimeout(this.check.bind(this), 1000);
    }

    async disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = WorkerSoundCloudChecker;
