const Base = require('./base');

const flow = {};

flow.process = async function (method, ...args) {
    const base = new Base();
    base.dao = this;

    // run method
    let result = await method.bind(base)(...args);

    // close connections
    for (let conn of base.listConnection)
        conn.knex.destroy();

    return result;
};

module.exports = flow;