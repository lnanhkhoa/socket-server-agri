const database = require('../index');

const TABLE = 'store_image';

module.exports = class {
    static async getListByStoreId(store_id, {sort}) {
        let deliveryDb = this.openDeliveryConnection();

        let query = deliveryDb.table(TABLE)
            .where({store_id: store_id});

        if (sort)
            query = query.sort(sort);

        return await query;
    }
};

database.register(module.exports);