const database = require('../index');

const TABLE = 'product_category';
const STATE = Object.freeze({
    ACTIVE: 'active', // hoạt động
    INACTIVE: 'inactive', // đã khóa
});

module.exports = class {
    static get config() {
        return {
            STATE,
        }
    }

    static async getListByStoreId(store_id, {sort, state}) {
        let deliveryDb = this.openDeliveryConnection();

        let query = deliveryDb.table(TABLE)
            .where({store_id: store_id});

        if (sort)
            query = query.sort(sort);

        if (state)
            query = query.where({state: state});

        return await query;
    };
};

database.register(module.exports);