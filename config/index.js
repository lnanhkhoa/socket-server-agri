const util = require('../core/util');

let config = {
    configFile: process.env.CONFIG_FILE,
    isDevelopment: util.isNullOrUndefined(process.env.NODE_ENV) || process.env.NODE_ENV === 'development',
    cluster: {
        workerCount: 1,
    },
    apiServer: {
        port: 8080,
        path: '/api',
        localSecretKey: undefined,
    },
    lalamove: {
        host: undefined,
        country: undefined,
        customerId: undefined,
        key: undefined,
        secret: undefined,
    },
    redmine: {
        host: undefined,
        apiKey: undefined,
        requestTimeout: 1000,
    },
    session: {
        adminCheckUrl: undefined,
        merchantCheckUrl: undefined,
        userCheckUrl: undefined,
    },
    redis: {
        host: undefined,
        port: undefined,
        prefix: undefined,
    },
    database: {
        agrismart: {
            client: undefined,
            connection: {
                host: undefined,
                port: undefined,
                user: undefined,
                password: undefined,
                database: undefined,
            },
        },
    },
};

if (!config.configFile)
    config.configFile = config.isDevelopment ? 'development' : 'production';

function merge(source, target) {
    for (let key in target) {
        if (typeof target[key] !== 'object')
            source[key] = target[key];
        else
            merge(source[key], target[key]);
    }
}

merge(config, require(`./config.${config.configFile}`));

module.exports = config;