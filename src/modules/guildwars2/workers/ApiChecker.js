'use strict';

const gw2Api = require('../api');

const Worker = require('../../../../bot/modules/Worker');


class WorkerApiChecker extends Worker {
    constructor(bot) {
        super(bot, 'api-checker');
    }

    async check() {
        try {
            await gw2Api.build().get();
            // API is working normally, hopefully
            this.onFire(false);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                // API is on fire!
                this.onFire(true);
            }
        }
    }

    onFire(fire) {
        const module = this.getModule();
        const wasOnFire = module.isApiOnFire();
        if (wasOnFire !== fire) {
            this.log(`API ${fire ? 'went on fire' : 'is back to normal'}`);
            this.emit('on-fire', fire);
            module.isApiOnFire(fire);
        }
    }

    async enableWorker() {
        this._intervalId = setInterval(this.check.bind(this), 300000);
        return this.check();
    }

    async disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = WorkerApiChecker;
