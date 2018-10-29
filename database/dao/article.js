const database = require('../index');

const TABLE = 'article';
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

    static async getPage({page, page_size, sort, state}) {
        let deliveryDb = this.openDeliveryConnection();

        let query = deliveryDb.table(TABLE);

        if (sort)
            query = query.sort(sort);

        if (state)
            query = query.where({state: state});

        return await query.paging(page, page_size);
    }
};

database.register(module.exports);