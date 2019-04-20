// 


console.log(Number(false))
const _ = require('lodash')
const moment = require('moment')
const config = require('./config')
const database = require("./database/")
const base = new database.base()
const randomString = require('randomstring')



const sample = () => ({
    string1: randomString.generate(12),
    num1: Math.random(12),
    bool1: true,
    text1: randomString.generate(120),
    datetime1: moment().format('YYYY-MM-DD hh:mm:ss')

})


const create = async () => {
    const db = base.openConnection('testing')
    const _list = _.range(10000)
    const list = _list.map(i => sample())
    db.table('table_test').insert(list).then(() => {
        for (let conn of base.listConnection) {
            conn.knex.destroy();
        }
    })
}

setInterval(async () => {
    await create()
}, 1000);