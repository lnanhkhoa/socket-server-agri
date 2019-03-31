require("module-alias/register");
const database = require('../database');
const config = require('../config')
const Confirm = require('prompt-confirm');
const models = database.models;

const listModels = Object.keys(models);
const onUpdateTrigger = (nameDatabase, table) => `
      DROP TRIGGER IF EXISTS \`${nameDatabase}\`.\`${table}_updated_at\`;
      DELIMITER $$
      USE \`${nameDatabase}\`$$
      CREATE DEFINER=\`admin\`@\` % \` TRIGGER \`${table}_updated_at\` BEFORE UPDATE ON \`${table}\`
      FOR EACH ROW BEGIN
      SET NEW.updated_at = CURRENT_TIMESTAMP;
      END;$$
      DELIMITER ;
      `;

let createTrigger = async function () {
    await listModels.forEach(async (model) => {
        // let exists = await database.serializes(models[listModels[0]])
        // if (model === 'log_user_action') {
            // let exists = await database.serializes(models[model])
        console.log(onUpdateTrigger('loyalty', model))
        // }
    })
}


createTrigger()



// const createTrigger = await db.schema.raw(onUpdateTrigger(nameDatabase, nameTable));
