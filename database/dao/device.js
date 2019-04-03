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
            device_uuid: types.string({ index: true, max: 300 }),
            node_id: types.number({ index: true }),
            url: types.string({}),
            device_name: types.string({ max: 200 }),
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

    static async insertBulk(list_device) {
        const db = this.openAConnection()
        const nameTable = this.dao._nameTable();

        list_device.map(device => {
            const parseResults = this.dao._parseSchema(device);
            if (!_.get(parseResults, 'meta.success', undefined)) throw { ...parseResults }
        })
        const idAfterInsert = await db.table(nameTable).insert(list_device)
        const id = idAfterInsert[0];
        if (!id) throw { code: 'id_is_valid' }
        return id
    }


    static async getById(id) {
        const db = this.openAConnection()
        const nameTable = this.dao._nameTable();
        return await db.table(nameTable).where('id', id).first();
    }

    static async getListByListNodeDeviceUrl({ node_id, list_device_url }) {
        const db = this.openAConnection()
        const nameTable = this.dao._nameTable();
        return await db.table(nameTable).where('node_id', node_id)
            .whereIn('url', list_device_url)
    }


    static async getAll() {
        return db
    }

};

database.register(module.exports)