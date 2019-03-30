const _ = require('lodash')
const types = require('../../core/types')
const config = require('../../config')
const database = require('../index');
const moment = require('moment')

const db = [
    { id: 1 }
]

module.exports = class {
    static nameTable = () => "user_home"

    static schema = () => ({
        id: types.number({ increments: true, primary: true }),
        user_id: types.string({}),
        home_id: types.string({}),
    })

    static parseSchema(object) {
        const schema = this._schema();
        try {
            for (let key in object) {
                let nameType = Object.getPrototypeOf(schema[key]).constructor.name;
                let value = types[nameType].parse(object[key], schema[key]._data);
            }
        } catch (error) {
            return {
                meta: { success: false },
                error: { message: `${key} cannot parsed. ${error} [DEV MODE]` }
            }
        }
        return { meta: { success: true } }
    }

    static async getById(id) {
        return _.find(db, item => item.id === id)
    }

};