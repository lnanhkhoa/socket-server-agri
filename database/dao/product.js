const database = require('../index');

const TABLE = 'product';
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

    static async getListByCategoryId(category_id, {sort, state}) {
        let deliveryDb = this.openDeliveryConnection();

        let query = deliveryDb.table(TABLE).select('product.*')
            .join('product_category_mapping', 'product_category_mapping.product_id', 'product.id')
            .where({'product_category_mapping.category_id': category_id});

        if (sort) {
            for (let sortItem of sort) {
                if (!sortItem.col || sortItem.col.includes('.'))
                    continue;
                sortItem.col = 'product.' + sortItem.col;
            }

            query = query.sort(sort);
        }

        if (state)
            query = query.where({'product.state': state});

        return await query;
    }
};

database.register(module.exports);