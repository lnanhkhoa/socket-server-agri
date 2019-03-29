const Base = require('./base');
const flow = require('./flow');
const dao = {};

module.exports = {
    base: require('./base'),
    dao: dao,

    register: function (dao) {
        for (let methodName of Object.getOwnPropertyNames(dao)) {
            if (['length', 'prototype'].includes(methodName) || typeof dao[methodName] !== 'function')
                continue;

            dao['_' + methodName] = dao[methodName];
            dao[methodName] = async function (...args) {
                return await flow.process.bind(this)(dao['_' + methodName], ...args)
            };
        }
    }
};
