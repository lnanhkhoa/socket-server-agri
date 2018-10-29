const database = require('../index');

module.exports = class {
    static async getByKey(key) {
        let deliveryDb = this.openDeliveryConnection();

        return await deliveryDb.table('config').where({key: key}).first();
    }

    static async getValueByKey(key) {
        let config = await this.dao.getByKey(key);
        if (!config)
            throw {code: 'config_not_found'};

        return config.value;
    }
};

database.register(module.exports);