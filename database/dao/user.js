const _ = require('lodash')
const types = require('../../core/types')
const config = require('../../config')
const database = require('../index');


module.exports = class {
  static nameTable() { return "user" }

  static sample() {
    return [
      { user_name: 'ios', password: '123456', token_key: 'ios_android_secret' }
    ]
  }


  static schema() {
    return {
      id: types.number({ increments: true, primary: true }),
      user_name: types.string({ max: 200 }),
      password: types.string({}),
      token_key: types.string({ max: 300 }),
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

  static async getAll() {
    return user_db
  }

};

database.register(module.exports);