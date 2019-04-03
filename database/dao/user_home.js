const _ = require('lodash')
const types = require('../../core/types')
const config = require('../../config')
const database = require('../index');
const dao = database.dao;

module.exports = class {
  static nameTable() {
    return "user_home"
  }

  static sample() {
    return [
      { user_id: 1, home_id: 1 }
    ]
  }

  static schema() {
    return {
      id: types.number({ increments: true, primary: true }),
      user_id: types.string({}),
      home_id: types.string({}),
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

  static async getById(id) {
    const db = this.openAConnection()
    const nameTable = this.dao._nameTable();
    return await db.table(nameTable).where('id', id).first();

  }

};


database.register(module.exports);