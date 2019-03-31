const _ = require('lodash')
const Base = require('./base');
const flow = require('./flow');
const config = require('../config')
const utilsKnex = require('./utilsKnex')

const dao = {};
const nameDatabase = config.database.agrismart.connection.database;


module.exports = {
    base: require('./base'),
    dao: dao,
    utilsKnex: utilsKnex,

    register: function (dao) {
        for (let methodName of Object.getOwnPropertyNames(dao)) {
            if (['length', 'prototype'].includes(methodName) || typeof dao[methodName] !== 'function')
                continue;

            dao['_' + methodName] = dao[methodName];
            dao[methodName] = async function (...args) {
                return await flow.process.bind(this)(dao['_' + methodName], ...args)
            };
        }
    },
    serializes: async function (dao) {
        const schema = dao._schema();
        const keysSchema = Object.keys(schema);
        const base = new Base();
        // await base.createIfNotExists(nameDatabase);
        const db = base.openConnection(nameDatabase);
        const nameTable = dao._nameTable();
        const exists = await db.schema.hasTable(nameTable);
        let results = {};
        let listPrimary = (() => {
            let list = [];
            for (let item in schema) {
                if (!!schema[item]._data.primary && !schema[item]._data.increments) {
                    list.push(item);
                }
            }
            return list;
        })();

        if (!exists) {
            results = await db.schema.createTable(nameTable, table => {
                Object.keys(schema).forEach(function (key) {
                    utilsKnex.process(db, table, schema[key], key);
                });
                if (listPrimary.length > 0) table.primary(listPrimary);
                table.timestamps(true, true);
            });

        } else {
            let columnsName = await db.schema.raw(`
            select Column_name from Information_schema.columns 
            where table_schema='${nameDatabase}' and
            Table_name = '${nameTable}'`);
            columnsName = columnsName[0];
            const arrayColumnsName = columnsName.map(res => Object.values(res)[0]);

            const diffAddColumn = _.difference(keysSchema, arrayColumnsName);
            const diffDropColumn = _.difference(arrayColumnsName, keysSchema);
            console.log(diffAddColumn, diffDropColumn);

            results = await db.schema.table(nameTable, function (table) {
                diffAddColumn.every(function (key) {
                    utilsKnex.process(db, table, schema[key], key)
                    console.log('CREATE', nameTable, key)
                    return true
                })

                diffDropColumn.every(function (key) {
                    if (key === 'created_at' || key === 'updated_at') return false
                    // table.dropColumn(key)
                    console.log('need DROP', nameTable, key)
                    return true
                })
                let listPrimaryAdd = _.intersection(diffAddColumn, listPrimary)
                if (listPrimaryAdd.length > 0) table.primary(listPrimary);
            })
        }

        // const onUpdateTrigger = (nameDatabase, table) =>
        //     `DROP TRIGGER IF EXISTS \`loyalty\`.\`log_user_action_updated_at\`;
        // DELIMITER \$\$
        // USE \`loyalty\`\$\$
        // CREATE DEFINER = CURRENT_USER TRIGGER log_user_action_updated_at
        //   BEFORE UPDATE ON log_user_action
        //   FOR EACH ROW
        //   BEGIN
        //   SET NEW.updated_at = CURRENT_TIMESTAMP;
        //   END\$\$
        // DELIMITER ;`;
        // console.log(onUpdateTrigger(nameDatabase, nameTable));
        // const createTrigger = await db.schema.raw(onUpdateTrigger(nameDatabase, nameTable));


        db.destroy();
        return exists;
    },
    
    insertSampleData: async function (dao, sampleData) {
        const schema = await dao.schema();
        const keysSchema = Object.keys(schema);
        const base = new Base();
        const db = base.openConnection(nameDatabase);
        const nameTable = await dao.nameTable();
        const exists = await db.schema.hasTable(nameTable);
        if (!!exists) {
            await db.table(nameTable).truncate();
            let results = await db.table(nameTable).insert(sampleData);
            db.destroy();
            return results;
        }
        db.destroy();
        return null;
    }
};


dao.user = require('./dao/user')
dao.user_home = require('./dao/user_home')
dao.home = require('./dao/home')
dao.home_node = require('./dao/home_node')
dao.node = require('./dao/node')
dao.node_device = require('./dao/node_device')
dao.device = require('./dao/device')