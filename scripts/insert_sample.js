// require('module-alias/register');

console.log('=== Insert table in database ===');
const database = require('../database')
const dao = database.dao;

const listSample = Object.keys(dao);
// const listSample = ["review", "comment", "comment_edited_content", 'rating', 'like_in_comment'];
let insertDatabase = async function () {
  await listSample.forEach(async (name) => {
    await database.insertSampleData(dao[name], dao[name]._sample())
    console.log(`insert completely table: ${name}`)
  })
}

// console.log(`Block insert Sample Database`)
insertDatabase()