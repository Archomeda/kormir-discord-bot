'use strict';

const Promise = require('bluebird');
const Feedparser = require('feedparser');
const request = require('request');

const BackgroundWorker = require('../../BackgroundWorker');


const forumRss = 'https://forum-en.guildwars2.com/forum/info/updates.rss';

/**
 * A worker for checking for new Guild Wars 2 releases.
 */
class ReleaseChecker extends BackgroundWorker {
    run() {
        return Promise.all([
            this.getLatestBuild(),
            this.getLatestReleaseNotes(),
            this.checkBuild(),
            this.checkReleaseNotes()
        ]).then(([oldBuild, oldReleaseNotes, build, releaseNotes]) => {
            // Process the stored/live build and release notes

            const getPostId = url => url ? parseInt(url.match(/(\d+)$/)[1], 10) : undefined;
            const lastReleaseNotesId = getPostId(oldReleaseNotes) || 0;
            let newReleaseNotes = releaseNotes ? releaseNotes.filter(notes => (getPostId(notes.link) || 0) > lastReleaseNotesId) : [];

            const exec = [];
            if (build && build !== oldBuild) {
                exec.push(this.setLatestBuild(build));
            }
            if (newReleaseNotes.length > 0 && newReleaseNotes[0].link !== oldReleaseNotes) {
                // First element has the last new post, last element has the first new post
                const link = newReleaseNotes[0].link;
                exec.push(this.setLatestReleaseNotes(link));
            }

            newReleaseNotes = newReleaseNotes.length > 0 ? newReleaseNotes[newReleaseNotes.length - 1] : undefined;
            return Promise.all(exec).return([oldBuild, oldReleaseNotes, build, newReleaseNotes]);
        }).then(([oldBuild, oldReleaseNotes, newBuild, newReleaseNotes]) => {
            if (oldBuild && newBuild && oldBuild !== newBuild) {
                // We got a new build
                this.debug(`Emitting new build: ${newBuild}`);
                this.emit('new build', newBuild, new Date());
            }
            if (oldReleaseNotes && newReleaseNotes && oldReleaseNotes !== newReleaseNotes.link) {
                // We got new release notes
                this.debug(`Emitting new release notes: ${newReleaseNotes.link}`);
                this.emit('new release notes', newReleaseNotes, new Date(newReleaseNotes.pubDate));
            }
        }).catch(err => {
            this.error(err);
        });
    }


    checkBuild() {
        return this.gw2Api.build().get().then(build => {
            this.debug(`Got live build: ${build}`);
            return build;
        });
    }

    checkReleaseNotes() {
        return this.readRss(forumRss)
            .then(reader => {
                const latestThread = reader.read();
                this.debug(`Got live latest release notes thread: ${latestThread.link}`);

                return this.readRss(`${latestThread.link}.rss`);
            }).then(reader => {
                const allNotes = [];
                let notes;
                while ((notes = reader.read())) {
                    allNotes.push(notes);
                }

                this.debug(`Number of found live release notes in latest release notes thread: ${allNotes.length}`);
                return allNotes;
            });
    }

    readRss(url) {
        return new Promise((resolve, reject) => {
            const debug = this.debug.bind(this);
            debug(`Reading RSS feed ${url}`);

            const r = request(url);
            const feed = new Feedparser();
            r.on('error', reject);
            r.on('response', function (res) {
                debug(`Got RSS feed request response: ${res.statusCode}`);
                if (res.statusCode >= 200 && res.statusCode <= 299) {
                    this.pipe(feed);
                } else {
                    reject(new Error('Invalid status code ' + res.statusCode));
                }
            });
            feed.on('error', reject);
            let read = false;
            feed.on('readable', function () {
                if (!read) {
                    resolve(this);
                    read = true;
                }
            });
        });
    }


    getLatestBuild() {
        return this.cache.get('Gw2ReleaseChecker', 'build');
    }

    setLatestBuild(build) {
        return this.cache.set('Gw2ReleaseChecker', 'build', undefined, build);
    }

    getLatestReleaseNotes() {
        return this.cache.get('Gw2ReleaseChecker', 'notes');
    }

    setLatestReleaseNotes(releaseNotes) {
        return this.cache.set('Gw2ReleaseChecker', 'notes', undefined, releaseNotes);
    }
}

module.exports = new ReleaseChecker();
