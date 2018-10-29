const api = require('../../../api');
const types = require('../../../core/types');
const dao = require('../../../database').dao;
const util = require('../../../core/util');
const moment = require('moment');

const storeResponseModel = types.object({
    id: types.number({description: 'id cửa hàng'}),
    merchant_id: types.number({description: 'id merchant'}),
    name: types.string({description: 'tên cửa hàng'}),
    description: types.string({description: 'mô tả cửa hàng'}),
    address: types.string({description: 'địa chỉ cửa hàng'}),
    lat: types.number({description: 'tọa độ địa lý lat'}),
    lng: types.number({description: 'tọa độ địa lý lng'}),
    is_opening: types.boolean({description: 'cửa hàng đang trong giờ mở cửa'}),
    trusted_store: types.boolean({description: 'cửa hàng uy tín?'}),
    logo_link: types.string({description: 'link ảnh logo cửa hàng'}),
    service_price_type: types.string({
        description: 'loại phí dịch vụ áp dụng',
        enum: Object.values(dao.store.config.SERVICE_PRICE_TYPE),
    }),
    service_price: types.number({description: 'phí dịch vụ'}),
    min_money_to_go_shipping: types.number({description: 'tổng thanh toán tối thiểu để áp dụng dịch vụ giao hàng'}),
    ship_price_type: types.string({
        description: 'loại phí giao hàng vụ áp dụng',
        enum: Object.values(dao.store.config.SHIP_PRICE_TYPE),
    }),
    ship_price: types.number({description: 'phí giao hàng'}),
    cashback_type: types.string({
        description: 'hình thức hoàn tiền áp dụng',
        enum: Object.values(dao.store.config.CASHBACK_TYPE),
    }),
    cashback_price: types.number({description: 'mức hoàn tiền'}),
    shipping_distance: types.number({description: 'khoảng cách ship, đơn vị m'}),
    shipping_duration: types.number({description: 'thời gian ship, đơn vị phút'}),
    list_tag: types.list(types.object({
        id: types.number({description: 'id phân loại'}),
        name: types.string({description: 'tên phân loại'}),
        image_link: types.string({description: 'link ảnh phân loại'}),
    }), {description: 'danh sách phân loại của cửa hàng'}),
});

const storeDetailResponseModel = types.object({
    id: types.number({description: 'id cửa hàng'}),
    merchant_id: types.number({description: 'id merchant'}),
    state: {
        type: types.string({description: 'trạng thái cửa hàng'}),
        enum: [dao.store.config.STATE.ACTIVE, dao.store.config.STATE.PAUSED],
    },
    name: types.string({description: 'tên cửa hàng'}),
    description: types.string({description: 'mô tả cửa hàng'}),
    address: types.string({description: 'địa chỉ cửa hàng'}),
    lat: types.number({description: 'tọa độ địa lý lat'}),
    lng: types.number({description: 'tọa độ địa lý lng'}),
    is_opening: types.boolean({description: 'cửa hàng đang trong giờ mở cửa'}),
    trusted_store: types.boolean({description: 'cửa hàng uy tín?'}),
    logo_link: types.string({description: 'link ảnh logo cửa hàng'}),
    min_price: types.number({description: 'giá món ăn tối thiểu'}),
    max_price: types.number({description: 'giá món ăn tối đa'}),
    open_time: types.datetime({description: 'giờ mở cửa'}),
    close_time: types.datetime({description: 'giờ đóng cửa'}),
    service_price_by_merchant: types.boolean({description: 'phí dịch vụ được xác nhận bởi merchant'}),
    service_price_type: types.string({
        description: 'loại phí dịch vụ áp dụng',
        enum: Object.values(dao.store.config.SERVICE_PRICE_TYPE),
    }),
    service_price: types.number({description: 'phí dịch vụ'}),
    min_money_to_free_service_price: types.number({description: 'tổng thanh toán tối thiểu để được miễn phí dịch vụ'}),
    min_money_to_go_shipping: types.number({description: 'tổng thanh toán tối thiểu để áp dụng dịch vụ giao hàng'}),
    ship_price_type: types.string({
        description: 'loại phí giao hàng vụ áp dụng',
        enum: Object.values(dao.store.config.SHIP_PRICE_TYPE),
    }),
    ship_price: types.number({description: 'phí giao hàng'}),
    min_money_to_free_ship_price: types.number({description: 'tổng thanh toán tối thiểu để được miễn phí giao hàng'}),
    cashback_type: types.string({
        description: 'hình thức hoàn tiền áp dụng',
        enum: Object.values(dao.store.config.CASHBACK_TYPE),
    }),
    cashback_price: types.number({description: 'mức hoàn tiền'}),
    shipping_distance: types.number({description: 'khoảng cách ship, đơn vị m'}),
    shipping_duration: types.number({description: 'thời gian ship, đơn vị phút'}),
    list_tag: types.list(types.object({
        id: types.number({description: 'id phân loại'}),
        name: types.string({description: 'tên phân loại'}),
        image_link: types.string({description: 'link ảnh phân loại'}),
    }), {description: 'danh sách phân loại của cửa hàng'}),
    list_image: types.list(types.object({
        id: types.number({description: 'id ảnh'}),
        image_link: types.string({description: 'link ảnh'}),
    }), {description: 'danh sách ảnh cửa hàng'}),
});

async function getStoreDetail({store, store_id, current_user_lat, current_user_lng, get_list_tag = false, get_list_image = false}) {
    if (!store)
        store = await await dao.store.getById(store_id);
    if (!store)
        return null;

    let default_service_price_fixed = await dao.config.getValueByKey('default_service_price_fixed');
    let default_service_price_percent = await dao.config.getValueByKey('default_service_price_percent');
    let default_min_money_to_free_service_price = await dao.config.getValueByKey('default_min_money_to_free_service_price');
    let default_ship_price_fixed = await dao.config.getValueByKey('default_ship_price_fixed');
    let default_ship_price_percent = await dao.config.getValueByKey('default_ship_price_percent');
    let default_min_money_to_free_ship_price = await dao.config.getValueByKey('default_min_money_to_free_ship_price');

    let openTime = store.open_time ? moment(store.open_time) : null;
    let closeTime = store.close_time ? moment(store.close_time) : null;
    let nowTime = moment().set({'year': 2018, 'month': 0, 'date': 1});
    let is_opening = true;
    if (openTime && nowTime.isBefore(openTime))
        is_opening = false;
    else if (openTime && nowTime.isAfter(closeTime))
        is_opening = false;

    let service_price;
    if (store.service_price_type === dao.store.config.SERVICE_PRICE_TYPE.FIXED)
        service_price = store.use_local_service_price ? store.service_price_fixed : default_service_price_fixed;
    else if (store.service_price_type === dao.store.config.SERVICE_PRICE_TYPE.PERCENT)
        service_price = store.use_local_service_price ? store.service_price_percent : default_service_price_percent;

    let ship_price;
    if (store.ship_price_type === dao.store.config.SHIP_PRICE_TYPE.FIXED)
        ship_price = store.use_local_ship_price ? store.ship_price_fixed : default_ship_price_fixed;
    else if (store.ship_price_type === dao.store.config.SHIP_PRICE_TYPE.PERCENT)
        ship_price = store.use_local_ship_price ? store.ship_price_percent : default_ship_price_percent;
    
    let result = {
        id: store.id,
        merchant_id: store.merchant_id,
        state: store.state,
        name: store.name,
        address: store.address,
        lat: store.lat,
        lng: store.lng,
        trusted_store: store.trusted_store,
        logo_link: store.logo_link,
        min_price: store.min_price,
        max_price: store.max_price,
        open_time: openTime,
        close_time: closeTime,
        is_opening: is_opening,
        service_price_by_merchant: store.service_price_by_merchant,
        service_price_type: store.service_price_type,
        service_price: service_price,
        min_money_to_free_service_price: store.use_local_service_price ? store.min_money_to_free_service_price : default_min_money_to_free_service_price,
        min_money_to_go_shipping: store.min_money_to_go_shipping,
        ship_price_type: store.ship_price_type,
        ship_price: ship_price,
        min_money_to_free_ship_price: store.use_local_service_price ? store.min_money_to_free_ship_price : default_min_money_to_free_ship_price,
    };

    if (current_user_lat && current_user_lng) {
        let shipping = await dao.store.getShippingDataById(store.id, {
            current_user_lat: current_user_lat,
            current_user_lng: current_user_lng,
        });
        result.shipping_distance = Math.floor(shipping.shipping_distance);
        result.shipping_duration = Math.floor(shipping.shipping_duration);
    } else {
        result.shipping_distance = Math.floor(store.shipping_distance);
        result.shipping_duration = Math.floor(store.shipping_duration);
    }

    if (get_list_tag) {
        let listTag = await dao.store_tag.getListByStoreId(store.id, {
            sort: [
                {col: 'priority', order: 'desc'},
                {col: 'name', order: 'asc'},
            ],
            state: dao.store_tag.config.STATE.ACTIVE,
            list_category_code: [dao.store_tag_category.config.CODE.CATEGORY],
        });

        result.list_tag = listTag.map(x => ({
            id: x.id,
            name: x.name,
            image_link: x.image_link,
        }));
    }

    if (get_list_image) {
        let listImage = await dao.store_image.getListByStoreId(store.id, {
            sort: [
                {col: 'priority', order: 'desc'},
                {col: 'id', order: 'asc'},
            ]
        });

        result.list_image = listImage.map(x => ({
            id: x.id,
            image_link: x.image_link,
        }));
    }

    return result;
}

// --------------------------------------------------------------------------------------------------------------

api.get({
    url: '/user/store/detail',
    redmine: 488,
    tags: ['store'],
    summary: 'chi tiết cửa hàng',
    shipping_receive_info: true,
    parameter: {
        store_id: {
            required: true,
            type: types.number({description: 'id cửa hàng'}),
        },
    },
    response: storeDetailResponseModel,
    error: [
        {code: 'not_found', message: 'không tìm thấy dữ liệu'},
        {code: 'inactive', message: 'cửa hàng bị khóa'},
    ],
    handle: async function (arg) {
        let store = await dao.store.getById(arg.store_id);
        if (!store)
            throw {code: 'not_found'};
        if (store.state === dao.store.config.STATE.INACTIVE)
            throw {code: 'inactive'};

        return await getStoreDetail({
            store: store,
            current_user_lat: arg.shipping_receive_lat,
            current_user_lng: arg.shipping_receive_lng,
            get_list_tag: true,
            get_list_image: true,
        });
    },
});

api.get({
    url: '/user/store',
    redmine: 534,
    tags: ['store'],
    summary: 'danh sách cửa hàng',
    shipping_receive_info: true,
    paging: true,
    parameter: {
        search: types.string({description: 'từ khóa tìm kiếm'}),
        tag_id: types.number({description: 'id phân loại cửa hàng'}),
        only_opening: {
            default: false,
            allow_null: false,
            type: types.boolean({description: 'chỉ lấy các cửa hàng còn mở cửa'}),
        },
    },
    response: types.list(storeResponseModel),
    handle: async function (arg) {
        let filter = {
            page: arg.page,
            page_size: arg.page_size,
            state: dao.store.config.STATE.ACTIVE,
            current_user_lat: arg.shipping_receive_lat,
            current_user_lng: arg.shipping_receive_lng,
            shipping_limit_time: arg.shipping_receive_time,
            is_opening: arg.only_opening,
        };
        if (arg.search)
            filter.search = arg.search;
        if (arg.tag_id)
            filter.list_tag = [arg.tag_id];

        let data = await dao.store.getPage(filter);

        this.pagingTotal = data.total;
        return await util.mapAwait(data.items, async item => await getStoreDetail({
            store: item,
            get_list_tag: true,
        }));
    }
});

api.get({
    url: '/user/store/list_hot',
    redmine: 495,
    tags: ['store'],
    summary: 'danh sách cửa hàng nổi bật',
    shipping_receive_info: true,
    paging: true,
    response: types.list(storeResponseModel),
    handle: async function (arg) {
        let data = await dao.store.getPage({
            page: arg.page,
            page_size: arg.page_size,
            state: dao.store.config.STATE.ACTIVE,
            current_user_lat: arg.shipping_receive_lat,
            current_user_lng: arg.shipping_receive_lng,
            shipping_limit_time: arg.shipping_receive_time,
            is_opening: true,
            sort: [
                {col: 'priority', order: 'desc'},
            ],
        });

        this.pagingTotal = data.total;
        return await util.mapAwait(data.items, async item => await getStoreDetail({
            store: item,
            get_list_tag: true,
        }));
    }
});

api.get({
    url: '/user/store/best_price',
    redmine: 498,
    tags: ['store'],
    summary: 'danh sách cửa hàng giá tốt nhất',
    shipping_receive_info: true,
    paging: true,
    response: types.list(storeResponseModel),
    handle: async function (arg) {
        let data = await dao.store.getPage({
            page: arg.page,
            page_size: arg.page_size,
            state: dao.store.config.STATE.ACTIVE,
            current_user_lat: arg.shipping_receive_lat,
            current_user_lng: arg.shipping_receive_lng,
            shipping_limit_time: arg.shipping_receive_time,
            is_opening: true,
            sort: [
                {col: 'min_price', order: 'asc'},
            ],
        });

        this.pagingTotal = data.total;
        return await util.mapAwait(data.items, async item => await getStoreDetail({
            store: item,
            get_list_tag: true,
        }));
    },
});

api.get({
    url: '/user/store/fasest',
    redmine: 497,
    tags: ['store'],
    summary: 'danh sách cửa hàng giao hành sớm nhất',
    shipping_receive_info: true,
    paging: true,
    response: types.list(storeResponseModel),
    handle: async function (arg) {
        let data = await dao.store.getPage({
            page: arg.page,
            page_size: arg.page_size,
            state: dao.store.config.STATE.ACTIVE,
            current_user_lat: arg.shipping_receive_lat,
            current_user_lng: arg.shipping_receive_lng,
            shipping_limit_time: arg.shipping_receive_time,
            is_opening: true,
        });

        this.pagingTotal = data.total;
        return await util.mapAwait(data.items, async item => await getStoreDetail({
            store: item,
            get_list_tag: true,
        }));
    }
});

api.get({
    url: '/user/store/recommend',
    redmine: 558,
    tags: ['store'],
    summary: 'danh sách cửa hàng đề xuất',
    shipping_receive_info: true,
    paging: true,
    response: types.list(storeResponseModel),
    handle: async function (arg) {
        let data = await dao.store.getPage({
            page: arg.page,
            page_size: arg.page_size,
            state: dao.store.config.STATE.ACTIVE,
            current_user_lat: arg.shipping_receive_lat,
            current_user_lng: arg.shipping_receive_lng,
            shipping_limit_time: arg.shipping_receive_time,
            is_opening: true,
            sort: [
                {col: 'count_complete_order', order: 'desc'},
            ],
        });

        this.pagingTotal = data.total;
        return await util.mapAwait(data.items, async item => await getStoreDetail({
            store: item,
            get_list_tag: true,
        }));
    }
});

api.get({
    url: '/user/store/article',
    redmine: 487,
    tags: ['store', 'article'],
    summary: 'danh sách các cửa hàng trong chủ đề',
    paging: true,
    shipping_receive_info: true,
    parameter: {
        article_id: {
            required: true,
            type: types.number({description: 'id chủ đề'}),
        },
    },
    response: types.list(storeResponseModel),
    error: [
        {code: 'article_not_found', message: 'không tìm thấy chủ đề'},
        {code: 'article_inactive', message: 'chủ đề bị khóa'},
    ],
    handle: async function (arg) {
        let article = await dao.article.getById(arg.article_id);
        if (!article)
            throw {code: 'article_not_found'};
        if (article.state === 'inactive')
            throw {code: 'article_inactive'};

        let data = await dao.store.getPage({
            page: arg.page,
            page_size: arg.page_size,
            state: dao.store.config.STATE.ACTIVE,
            current_user_lat: arg.shipping_receive_lat,
            current_user_lng: arg.shipping_receive_lng,
            shipping_limit_time: arg.shipping_receive_time,
            article_id: arg.article_id,
            sort: [
                {col: 'article_store_mapping.priority', order: 'desc'},
            ],
        });

        this.pagingTotal = data.total;
        return await util.mapAwait(data.items, async item => await getStoreDetail({
            store: item,
            get_list_tag: true,
        }));
    },
});