const database = require('../index');

const storeDao = require('./store');

const TABLE = 'promotion';
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

    static async getById(promotion_id) {
        let deliveryDb = this.openDeliveryConnection();

        return await deliveryDb.table(TABLE).where({id: promotion_id}).first();
    };

    static async getListByCode(code, {state}) {
        let deliveryDb = this.openDeliveryConnection();

        let query = deliveryDb.table(TABLE)
            .where({code: code});

        if (state)
            query.where({state: state});

        return query;
    };

    static async getPage({page, page_size, state, sort, start_date, end_date, merchant_id, store_id}) {
        let deliveryDb = this.openDeliveryConnection();

        let query = deliveryDb.table(TABLE);

        if (sort)
            query.sort(sort);

        if (state)
            query.where({state: state});

        if (start_date)
            query.whereRaw('(start_date <= ? or start_date is null)', [start_date.format('YYYY-MM-DD HH:mm:ss')]);

        if (end_date)
            query.whereRaw('(end_date >= ? or end_date is null)', [end_date.format('YYYY-MM-DD HH:mm:ss')]);

        if (merchant_id)
            query.whereRaw('(merchant_id = ? or merchant_id is null)', [merchant_id]);

        if (store_id) {
            let store = await storeDao.getById(store_id);
            query.whereRaw('(merchant_id = ? and (store_id = ? or store_id is null))', [store.merchant_id, store.id]);
        }

        return query.paging(page, page_size);
    };
};

database.register(module.exports);