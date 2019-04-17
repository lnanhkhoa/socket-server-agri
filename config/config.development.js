const util = require('../core/util');

let config = {
    configFile: 'development',
    isDevelopment: true,
    cluster: {
        workerCount: 1,
    },
    apiServer: {
        port: 1234,
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
            client: 'mysql',
            connection: {
                host: '45.117.168.231',
                // host: '127.0.0.1',
                port: 3306,
                user: 'agri',
                password: 'agri@123',
                database: 'agrismart',
                timezone: 'UTC',
                dateStrings: true,
            },
        },
    },
};

module.exports = config;