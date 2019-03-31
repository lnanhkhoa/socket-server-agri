const _ = require('lodash')
const types = require('../../core/types')
const config = require('../../config')
const database = require('../index')

module.exports = class {
  static nameTable() { return "home_node" }

  static sample() {
    return [
      { id: 1, home_id: 1, node_id: 1 },
      { id: 1, home_id: 1, node_id: 2 },
      { id: 1, home_id: 1, node_id: 3 }
    ]
  }

  static schema() {
    return {
      id: types.number({ increments: true, primary: true }),
      home_id: types.string({}),
      node_id: types.string({}),
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
    return _.find(db, item => item.id === id)
  }

};
database.register(module.exports)