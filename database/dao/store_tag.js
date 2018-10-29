const database = require('../index');

const TABLE = 'store_tag';
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

    static async getPage({page, page_size, sort, state, list_category_code}) {
        let deliveryDb = this.openDeliveryConnection();

        let query = deliveryDb.table(TABLE);

        if (sort)
            query = query.sort(sort);

        if (state)
            query.where({state: state});

        if (list_category_code)
            query.whereIn('category_code', list_category_code);

        return await query.paging(page, page_size);
    }

    static async getListByStoreId(store_id, {sort, state, list_category_code}) {
        let deliveryDb = this.openDeliveryConnection();

        let query = deliveryDb.table(TABLE).select('store_tag.*')
            .join('store_tag_mapping', 'store_tag_mapping.tag_id', 'store_tag.id')
            .where({'store_tag_mapping.store_id': store_id});

        if (sort) {
            for (let sortItem of sort) {
                if (!sortItem.col || sortItem.col.includes('.'))
                    continue;
                sortItem.col = 'store_tag.' + sortItem.col;
            }

            query = query.sort(sort);
        }

        if (state)
            query.where({'store_tag.state': state});

        if (list_category_code)
            query.whereIn('store_tag.category_code', list_category_code);

        return await query;
    }
};

database.register(module.exports);