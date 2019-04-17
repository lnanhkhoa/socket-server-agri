const _ = require('lodash')
const types = require('../../core/types')
const config = require('../../config')
const database = require('../index');
const dao = database.dao


module.exports = class {
    static nameTable() { return "config" }

    static schema() {
        return {
            id: types.number({ increments: true, primary: true }),
            home_name: types.string({ index: true }),
            object_id: types.number({ index: true }),
            object_type: types.string(),
            mean_humidity_value: types.number(),
            about_time: types.number()

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
        const db = this.openAConnection()
        const nameTable = this.dao._nameTable();
        return await db.table(nameTable).select('*');
    }

    static async getByHomeObjectId({ home_name, object_type, object_id }) {
        const db = this.openAConnection()
        const nameTable = this.dao._nameTable();
        return await db.table(nameTable)
            .where('home_name', home_name)
            .where('object_type', object_type)
            .where('object_id', object_id)
            .first()
    }


    static async insertBulk(list) {
        const db = this.openAConnection()
        const nameTable = this.dao._nameTable();

        list.map(item => {
            const parseResults = this.dao._parseSchema(item);
            if (!_.get(parseResults, 'meta.success', undefined)) throw { ...parseResults }
        })
        const idAfterInsert = await db.table(nameTable).insert(list)
        const id = idAfterInsert[0];
        if (!id) throw { code: 'id_is_valid' }
        return id
    }

    static async update({ id, params }) {
        const db = this.openAConnection()
        const nameTable = this.dao._nameTable();
        //filter falsey
        const paramsFilterFalsey = _.omitBy(params, _.isNil);
        const parseResults = this.dao._parseSchema(paramsFilterFalsey);
        if (!_.get(parseResults, 'meta.success', undefined)) throw { ...parseResults }

        const item_exist = dao.config.getById(id);
        if (!item_exist) throw { code: 'item_exist_existed' }

        const resultsAfterUpdate = await db.table(nameTable).where({ 'id': id }).update(paramsFilterFalsey)
        return resultsAfterUpdate
    }

    static async upsert({ home_name, object_type, object_id, config }) {
        const config_existed = await dao.config.getByHomeObjectId({ home_name, object_type, object_id })
        if (!!config_existed) {
            const res = await dao.config.update({ id: config_existed.id, params: config })
            return config_existed.id
        } else {
            return await dao.config.insertBulk([config])
        }
    }


};
database.register(module.exports)