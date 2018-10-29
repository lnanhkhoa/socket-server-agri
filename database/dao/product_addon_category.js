const database = require('../index');

const TABLE = 'product_addon_category';
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

    static async getById(id) {
        let deliveryDb = this.openDeliveryConnection();

        return await deliveryDb.table(TABLE).where({id: id}).first();
    }

    static async getListByProductId(product_id, {state, sort}) {
        let deliveryDb = this.openDeliveryConnection();

        let query = deliveryDb.table(TABLE)
            .where({product_id: product_id});

        if (sort)
            query = query.sort(sort);

        if (state)
            query = query.where({state: state});

        return await query;
    }
};

database.register(module.exports);