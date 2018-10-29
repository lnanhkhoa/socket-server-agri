const config = require('../config');
const redis = require('redis');
const {promisify} = require('util');

module.exports = class Redis {
    static get client() {
        if (this._client === undefined)
            this._client = redis.createClient(config.redis);

        return this._client;
    }

    static get lock() {
        return promisify(require('redis-lock')(Redis.client));
    }

    static get(key) {
        return new Promise((res, rej) => {
            Redis.client.get(
                key,
                (err, val) => {
                    if (err !== null)
                        rej(err);
                    else
                        res(val);
                });
        });
    }

    static set(key, value) {
        return new Promise((res, rej) => {
            Redis.client.set(
                key,
                value,
                (err) => {
                    if (err !== null)
                        rej(err);
                    else
                        res(value);
                });
        });
    }

    static delete(key) {
        return new Promise((res, rej) => {
            Redis.client.del(
                key,
                (err) => {
                    if (err !== null)
                        rej(err);
                    else
                        res();
                });
        });
    }
};