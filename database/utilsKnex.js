
const _ = require('lodash')
const types = require('../core/types')
var UtilsKnex = class { }

// UtilsKnex.prototype.integer = function (db, table, name) {
//   if (!!table && !!name) {
//     return table.integer(name)
//   }
//   return table
// }

// UtilsKnex.prototype.primary = function (db, table) {
//   if (!!table) {
//     return table.primary()
//   }
//   return table;
// }


UtilsKnex.prototype.string = function (db, table, name, length = 255) {
  if (!!table && !!name) {
    if (length < 21845)
      return table.string(name, length)
    else
      return table.text(name)
  }
  return table;
}

UtilsKnex.prototype.index = function (db, table, name) {
  if (!!table) return table.index(name);
  return table;
}

UtilsKnex.prototype.unique = function (db, table, name) {
  if (!!table) return table.unique(name);
  return table;
}

// UtilsKnex.prototype.date = function (db, table, name) {
//   if (!!table && !!name) {
//     return table.date(name)
//   }
//   return table
// }

// UtilsKnex.prototype.boolean = function (db, table, name) {
//   if (!!table && !!name) {
//     return table.boolean(name)
//   }
//   return table
// }

UtilsKnex.prototype.process = function (db, table, column, name) {
  let result = table;
  const typeName = Object.getPrototypeOf(column).constructor.name
  // console.log(typeName)
  switch (typeName) {
    case types.NumberType.name:
      if (!!column._data.increments) {
        result = result.increments(name)
      } else {
        if (!!column._data.float) {
          result = result.float(name, 12, 2)
        } else {
          result = result.integer(name)
        }
        const index = column._data.index;
        if (!!index) result = this.index(db, table, name)

        const unique = column._data.unique;
        if (!!unique) result = this.unique(db, table, name)
      }
      break;

    case types.StringType.name:
      const { max } = column._data;
      const _enum = column._data.enum;
      // const is_json = column._data.is_json;

      !!max ?
        !!_enum ?
          result = result.enu(name, _enum)
          : result = this.string(db, result, name, max).collate('utf8_unicode_ci')
        : result = this.string(db, result, name, 255).collate('utf8_unicode_ci');

      const index = column._data.index;
      if (!!index) result = this.index(db, table, name)

      const unique = column._data.unique;
      if (!!unique) result = this.unique(db, table, name)

      break;

    case types.DatetimeType.name:
      if (!!column._data.timestamp && column._data.default === 'now') {
        result = result.timestamp(name).defaultTo(db.fn.now());
      } else {
        result = result.dateTime(name);
      }
      break;

    case types.BooleanType.name:
      result = result.boolean(name)
      break;
  }

  return result
}

module.exports = new UtilsKnex()