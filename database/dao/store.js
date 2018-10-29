const database = require('../index');
const util = require('../../core/util');
const moment = require('moment');

const TABLE = 'store';
const STATE = Object.freeze({
    ACTIVE: 'active', // hoạt động
    INACTIVE: 'inactive', // đã khóa
    PAUSED: 'paused', // tạm ngưng
});
const SERVICE_PRICE_TYPE = Object.freeze({
    FIXED: 'fixed', // giá cứng
    PERCENT: 'percent', // giá theo phần trăm
});
const SHIP_PRICE_TYPE = Object.freeze({
    FIXED: 'fixed', // giá cứng
    PERCENT: 'percent', // giá theo phần trăm
});
const CASHBACK_TYPE = Object.freeze({
    FIXED: 'fixed', // giá cứng
    PERCENT: 'percent', // giá theo phần trăm
});

module.exports = class {
    static get config() {
        return {
            STATE,
            SERVICE_PRICE_TYPE,
            SHIP_PRICE_TYPE,
            CASHBACK_TYPE,
        }
    }

    static async getById(id) {
        let deliveryDb = this.openDeliveryConnection();

        return await deliveryDb.table(TABLE).where({id: id}).first();
    }

    static async getShippingDataById(id, {current_user_lat, current_user_lng}) {
        let deliveryDb = this.openDeliveryConnection();

        let query = deliveryDb.table(TABLE)
            .where({id: id});

        query = query.calcShippingData({
            currentUserLat: current_user_lat,
            currentUserLng: current_user_lng,
            col_store_id: 'id',
        });

        return await query.first();
    }

    static async getPage({page, page_size, sort, state, current_user_lat, current_user_lng, shipping_limit_time, is_opening, search, list_tag, article_id}) {
        let deliveryDb = this.openDeliveryConnection();

        let query = deliveryDb.table(TABLE).select(`store.*`);

        if (sort) {
            for (let sortItem of sort) {
                if (!sortItem.col || sortItem.col.includes('.'))
                    continue;
                sortItem.col = 'store.' + sortItem.col;
            }

            query = query.sort(sort);
        }

        if (state)
            query = query.where({'store.state': state});

        if (current_user_lat && current_user_lng) {
            query = query.calcShippingData({
                currentUserLat: current_user_lat,
                currentUserLng: current_user_lng,
                col_store_id: 'store.id',
                filter_by_shipping_limit_duration: true,
                shipping_limit_duration: await util.getShippingLimitDuration(shipping_limit_time),
            });
        }

        if (is_opening) {
            let nowTime = moment().set({'year': 2018, 'month': 0, 'date': 1}).toDate();
            query = query.where('store.open_time', '<=', nowTime);
            query = query.where('store.close_time', '>=', nowTime);
        }

        if (search)
            query = query.whereRaw('(store.name like ? OR store.address like ?)', [`%${search}%`, `%${search}%`]);

        if (list_tag) {
            query.join('store_tag_mapping', 'store_tag_mapping.store_id', 'store.id');
            query = query.whereIn('store_tag_mapping.tag_id', list_tag);
        }

        if (article_id) {
            query.join('article_store_mapping', 'article_store_mapping.store_id', 'store.id');
            query = query.where({'article_store_mapping.article_id': article_id});
        }

        return query.paging(page, page_size);
    };
};

database.register(module.exports);