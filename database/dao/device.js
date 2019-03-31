const _ = require('lodash')
const types = require('../../core/types')
const config = require('../../config')
const database = require('../index');
const dao = database.dao;

module.exports = class {
    static nameTable() { return "device" }

    static sample() {
        return [
        ]
    }
    static schema() {
        return {
            id: types.number({ increments: true, primary: true }),
            device_name: types.string({ max: 200 }),
            device_uuid: types.string({ max: 300 }),
            value: types.string({})
        }
    }

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

    static async insert(home) {
        const parseResults = this.models._parseSchema(bill_product);
        if (!_.get(parseResults, 'meta.success', undefined)) throw { ...parseResults }

        const index = _.push({ ...home });
        db[index - 1].id = index;
        return index
    }


    static async getById(id) {
        const db = this.openAConnection()
        const nameTable = this.dao._nameTable();
        return await db.table(nameTable).where('id', id).first();
    }

    static async getAll() {
        return db
    }

};

database.register(module.exports)