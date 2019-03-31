console.log('=== Create table in database ===');
// require('module-alias/register');
const _ = require('lodash')
const os = require('os');
const database = require('../database');
const config = require('../config')
const Confirm = require('prompt-confirm');
const dao = database.dao;

const listModels = Object.keys(dao);
let createTable = async function () {
  await listModels.forEach(async (model) => {
    // let exists = await database.serializes(models[listModels[0]])
    // if(model === 'log_user_action'){
      let exists = await database.serializes(dao[model])
      console.log(`create complete table: ${model}`);
    // }
  })
}

// console.log(`Worker ${process.pid} with ${config.configFile} started at http://localhost:${config.apiServer.port}`);
// console.log(os.networkInterfaces())
// const prompt = new Confirm('Do you want to create database in ...?');
// prompt.ask(function (answer) {
// console.log(answer);
createTable()
// });

