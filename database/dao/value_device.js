const _ = require('lodash')
const types = require('../../core/types')
const config = require('../../config')
const database = require('../index');
const dao = database.dao;

module.exports = class {
    static nameTable() { return "value_device" }

    static sample() {
        return [
        ]
    }
    static schema() {
        return {
            id: types.number({ increments: true, primary: true }),
            device_id: types.number({}),
            value: types.number({}),
            unit: types.string({}),
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

    static async insertBulk(list_value_device) {
        const db = this.openAConnection()
        const nameTable = this.dao._nameTable();

        list_value_device.map(value_device => {
            const parseResults = this.dao._parseSchema(value_device);
            if (!_.get(parseResults, 'meta.success', undefined)) throw { ...parseResults }
        })
        const idAfterInsert = await db.table(nameTable).insert(list_value_device)
        const id = idAfterInsert[0];
        if (!id) throw { code: 'id_is_valid' }
        return id
    }


    static async getListMappedById(device_id){
        const db = this.openAConnection()
        const nameTable = this.dao._nameTable();
        return await db.table(nameTable).select(['created_at', 'value'])
            .where('device_id', device_id)
            .orderBy('created_at', 'desc').limit(200).offset(0)
        // .paging({ page, page_size })
    }


    static async getById(id) {
        const db = this.openAConnection()
        const nameTable = this.dao._nameTable();
        return await db.table(nameTable).where('id', id).first();
    }


    static async getListNewestByListDeviceId(list_device_id) {
        // const length = list_device_id.length || 1;
        const db = this.openAConnection()
        const nameTable = this.dao._nameTable();
        const p_list_device_existed = list_device_id.map(async device_id => {
            return await db.table(nameTable).where('device_id', device_id)
                .orderBy('created_at', 'desc').first()
        })
        return await Promise.all(p_list_device_existed)
    }

    static async getAll() {
        return db
    }

};

database.register(module.exports)