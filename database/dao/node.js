const _ = require('lodash')
const types = require('../../core/types')
const config = require('../../config')
const database = require('../index');
module.exports = class {


  static nameTable() { return "node" }

  static sample() {
    return [
      // { home_id: 1, node_name: 'node_1', node_uuid: 'lesharn_node_1' }
    ]
  }

  static schema() {
    return {
      id: types.number({ increments: true, primary: true }),
      home_id: types.number({ index: true }),
      node_uuid: types.string(),
      node_name: types.string({ index: true, max: 300 }),
      node_name_app: types.string({ max: 200 }),
      registration_id: types.string({ index: true }),
      address: types.string(),

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

  // static async insert(node) {
  //   const parseResults = this.dao._parseSchema(node);
  //   if (!_.get(parseResults, 'meta.success', undefined)) throw { ...parseResults }

  //   const index = _.push({ ...node });
  //   db[index - 1].id = index;
  //   return index
  // }

  static async insertBulk(list_node) {
    const db = this.openAConnection()
    const nameTable = this.dao._nameTable();

    list_node.map(node => {
      const parseResults = this.dao._parseSchema(node);
      if (!_.get(parseResults, 'meta.success', undefined)) throw { ...parseResults }
    })
    const idAfterInsert = await db.table(nameTable).insert(list_node)
    const id = idAfterInsert[0];
    if (!id) throw { code: 'id_is_valid' }
    return id
  }


  static async getById(id) {
    const db = this.openAConnection()
    const nameTable = this.dao._nameTable();
    return await db.table(nameTable).where('id', id).first();
  }

  static async getByAddress(address) {
    const db = this.openAConnection()
    const nameTable = this.dao._nameTable();
    return await db.table(nameTable).where('address', address).first();
  }

  static async getByHomeIdRegId({ home_id, registration_id }) {
    const db = this.openAConnection()
    const nameTable = this.dao._nameTable();
    return await db.table(nameTable)
      .where('home_id', home_id)
      .where('registration_id', registration_id)
      .first();
  }

  static async getByHomeIdNodeName({ home_id, node_name }) {
    const db = this.openAConnection()
    const nameTable = this.dao._nameTable();
    return await db.table(nameTable)
      .where('home_id', home_id)
      .where('node_name', node_name)
      .first();
  }


  static async getListByListNodeName(list_node_name) {
    const db = this.openAConnection()
    const nameTable = this.dao._nameTable();
    return await db.table(nameTable).whereIn('node_name', list_node_name)
  }




  static async getAll() {
    const db = this.openAConnection();
    const nameTable = this.dao._nameTable();
    return await db.table(nameTable).select('*')
  }


};

database.register(module.exports)