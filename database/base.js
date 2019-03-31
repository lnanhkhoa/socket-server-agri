const knex = require('knex');
const queryBuilder = require('./query-builder');

module.exports = class {
    constructor() {
        this.listConnection = [];
    }

    openConnection(connection_name) {
        const config = Object.create(require('../config').database[connection_name]);
        const conn = {
            name: connection_name,
            knex: knex(config),
        };

        conn.queryBuilder = function () {
            return new queryBuilder(this.client);
        };

        this.listConnection.push(conn);
        return conn.knex;
    }

    openAConnection() {
        return this.openConnection('agrismart');
    }
};