const api = require('../../../api');
const types = require('../../../core/types');
const dao = require('../../../database').dao;
const util = require('../../../core/util');
const moment = require('moment');

async function getUserOrderDetail({user_order, user_order_uuid, get_list_quotation = false, get_product_count = false, get_list_product = false, get_tracking = false}) {
    if (!user_order)
        user_order = await dao.user_order.getByUuid(user_order_uuid);
    if (!user_order)
        return null;

    let result = {
        uuid: user_order.uuid,
        create_date: moment(user_order.create_date),
        complete_date: user_order.complete_date ? moment(user_order.complete_date) : null,
        receive_name: user_order.receive_name,
        receive_phone: user_order.receive_phone,
        receive_address: user_order.receive_address,
        state: user_order.state,
        money: user_order.money,
        note: user_order.note,
    };

    let merchant = await dao.merchant.getById(user_order.merchant_id);
    result.merchant_id = merchant.id;
    result.merchant_name = merchant.name;

    let store = await dao.store.getById(user_order.store_id);
    result.store_id = store.id;
    result.store_name = store.name;
    result.store_address = store.address;

    let user = await dao.user.getById(user_order.user_id);
    result.user_id = user.id;
    result.user_name = user.name;
    result.user_phone = user.phone;

    if (get_list_quotation) {
        let quotations = await dao.user_order.getListQuotation(user_order.uuid);
        result.list_quotation = quotations.map(x => ({
            code: x.code,
            name: x.name,
            money: x.money,
        }))
    }

    if (get_product_count)
        result.product_count = await dao.user_order.getCountTotalQuantity(user_order.uuid);

    if (get_list_product)
        result.list_product = await dao.user_order.getListProduct(user_order.uuid);

    if (get_tracking) {
        let list_tracking = await dao.user_order.getListTracking(user_order.uuid);
    }

    return result;
}

api.get({
    url: '/user/user_order/detail',
    redmine: 504,
    tags: ['user_order'],
    summary: 'chi tiết đơn hàng',
    require_user_auth: true,
    parameter: {
        user_order_uuid: {
            required: true,
            allow_null: false,
            type: types.string({description: 'uuid đơn hàng', allowEmpty: false}),
        },
    },
    response: types.object({
        uuid: types.string({description: 'uuid đơn hàng'}),
        create_date: types.datetime({description: 'thời gian khởi tạo đơn hàng'}),
        complete_date: types.datetime({description: 'thời gian hoàn tất đơn hàng'}),
        merchant_id: types.number({description: 'id merchant'}),
        merchant_name: types.string({description: 'tên merchant'}),
        store_id: types.number({description: 'id cửa hàng'}),
        store_name: types.string({description: 'tên cửa hàng'}),
        store_address: types.string({description: 'địa chỉ cửa hàng'}),
        user_id: types.number({description: 'id người đặt'}),
        user_name: types.string({description: 'tên người đặt'}),
        user_phone: types.string({description: 'số điện thoại người đặt'}),
        receive_name: types.string({description: 'tên người nhận'}),
        receive_phone: types.string({description: 'số điện thoại người nhận'}),
        receive_address: types.string({description: 'địa chỉ nhận hàng'}),
        state: types.string({
            description: 'trạng thái đơn hàng',
            enum: Object.values(dao.user_order.config.STATE),
        }),
        money: types.number({description: 'tổng thanh toán'}),
        cashback: types.number({description: 'tổng hoàn tiền'}),
        note: types.string({description: 'ghi chú đơn hàng'}),
        list_quotation: types.list(types.object({
            code: types.string({description: 'mã phí'}),
            name: types.string({description: 'tên phí'}),
            money: types.number({description: 'số tiền'}),
        }), {description: 'danh sách báo giá'}),
        list_product: types.list(types.object({
            id: types.number({description: 'id sản phẩm'}),
            name: types.string({description: 'tên sản phẩm'}),
            price: types.number({description: 'đơn giá'}),
            quantity: types.number({description: 'số lượng'}),
            note: types.string({description: 'ghi chú trên sản phẩm'}),
            list_addon: types.list(types.object({
                addon_id: types.number({description: 'id tùy chọn'}),
                addon_name: types.string({description: 'tên tùy chọn'}),
                addon_category_id: types.number({description: 'id nhóm tùy chọn'}),
                addon_category_name: types.string({description: 'tên nhóm tùy chọn'}),
                data_type: types.string({description: 'dạng dữ liệu của nhóm tùy chọn'}),
                value: types.raw({description: 'dữ liệu của tùy chọn'}),
            }), {description: 'danh sách tùy chọn'}),
        }), {description: 'danh sách sản phẩm'}),
    }),
    error: [
        {code: 'not_found', message: 'không tìm thấy dữ liệu'},
    ],
    handle: async function (arg) {
        let order = await getUserOrderDetail({
            user_order_uuid: arg.user_order_uuid,
            get_list_quotation: true,
            get_list_product: true,
            get_tracking: true,
        });
        if (!order || order.user_id !== this.currentUserId)
            throw {code: 'not_found'};

        return order;
    },
});

api.get({
    url: '/user/user_order',
    redmine: 503,
    tags: ['user_order'],
    summary: 'lịch sử đơn hàng',
    require_user_auth: true,
    paging: true,
    parameter: {
        create_date_from: types.datetime({description: 'lọc theo thời gian khởi tạo (chặn dưới)'}),
        create_date_to: types.datetime({description: 'lọc theo thời gian khởi tạo (chặn trên)'}),
        complete_date_from: types.datetime({description: 'lọc theo thời gian hoàn tất (chặn dưới)'}),
        complete_date_to: types.datetime({description: 'lọc theo thời gian hoàn tất (chặn trên)'}),
        state: {
            type: types.string({
                description: 'lọc theo trạng thái đơn hàng',
                enum: Object.values(dao.user_order.config.STATE),
            }),
        }
    },
    response: types.list(types.object({
        uuid: types.string({description: 'uuid đơn hàng'}),
        create_date: types.datetime({description: 'thời gian khởi tạo đơn hàng'}),
        complete_date: types.datetime({description: 'thời gian hoàn tất đơn hàng'}),
        merchant_id: types.number({description: 'id merchant'}),
        merchant_name: types.string({description: 'tên merchant'}),
        store_id: types.number({description: 'id cửa hàng'}),
        store_name: types.string({description: 'tên cửa hàng'}),
        store_address: types.string({description: 'địa chỉ cửa hàng'}),
        user_id: types.number({description: 'id người đặt'}),
        user_name: types.string({description: 'tên người đặt'}),
        user_phone: types.string({description: 'số điện thoại người đặt'}),
        receive_name: types.string({description: 'tên người nhận'}),
        receive_phone: types.string({description: 'số điện thoại người nhận'}),
        receive_address: types.string({description: 'địa chỉ nhận hàng'}),
        state: types.string({
            description: 'trạng thái đơn hàng',
            enum: Object.values(dao.user_order.config.STATE),
        }),
        money: types.number({description: 'tổng thanh toán'}),
        product_count: types.number({description: 'số lượng sản phẩm'}),
    })),
    handle: async function (arg) {
        let filter = {
            page: arg.page,
            page_size: arg.page_size,
            user_id: this.currentUserId,
        };
        if (arg.create_date_from)
            filter.create_date_from = arg.create_date_from;
        if (arg.create_date_to)
            filter.create_date_to = arg.create_date_to;
        if (arg.complete_date_from)
            filter.complete_date_from = arg.complete_date_from;
        if (arg.complete_date_to)
            filter.complete_date_to = arg.complete_date_to;
        if (arg.state)
            filter.state = arg.state;

        let data = await dao.user_order.getPage(Object.assign({
            sort: [
                {col: 'complete_date', order: 'desc'},
                {col: 'create_date', order: 'desc'},
            ],
        }, filter));

        this.pagingTotal = data.total;
        return await util.mapAwait(data.items, async item => await getUserOrderDetail({
            user_order: item,
            get_product_count: true
        }));
    },
});

api.post({
    url: '/user/user_order',
    redmine: 505,
    tags: ['user_order'],
    summary: 'khởi tạo đơn hàng',
    shipping_receive_info: true,
    require_user_auth: true,
    parameter: {
        store_id: {
            required: true,
            allow_null: false,
            type: types.number({description: 'id cửa hàng'}),
        },
        receive_name: {
            required: true,
            allow_null: false,
            type: types.string({description: 'tên người nhận hàng', allowEmpty: false}),
        },
        receive_phone: {
            required: true,
            allow_null: false,
            type: types.string({description: 'số điện thoại người nhận hàng', allowEmpty: false}),
            parse: (value, config, end_point) => {
                if (util.isNullOrUndefined(value))
                    return value;
                if (!util.isPhoneNumber(value))
                    throw 'must be phone number';
                return value;
            },
        },
        note: types.string({description: 'ghi chú đơn hàng'}),
        list_product: {
            required: true,
            allow_null: false,
            type: types.list(types.object({
                product_id: {
                    required: true,
                    allow_null: false,
                    type: types.number({description: 'id sản phẩm'}),
                },
                quantity: {
                    required: true,
                    allow_null: false,
                    type: types.number({description: 'số lượng', min: 1}),
                },
                note: types.string({description: 'ghi chú'}),
                list_addon: types.list(types.object({
                    addon_id: {
                        required: true,
                        allow_null: false,
                        type: types.number({description: 'id addon'}),
                    },
                    value: {
                        required: true,
                        allow_null: false,
                        type: types.string({description: 'dữ liệu addon'}),
                    },
                }), {description: 'danh sách addon'}),
            }), {description: 'danh sách sản phẩm', min: 1}),
        },
    },
    response: types.string({description: 'uuid của đơn hàng'}),
    error: [
        {code: 'store_not_found', message: 'không tìm thấy cửa hàng'},
        {code: 'store_inactive', message: 'cửa hàng tạm ngưng hoạt động'},
        {code: 'merchant_not_found', message: 'không tìm thấy merchant'},
        {code: 'merchant_inactive', message: 'merchant tạm ngưng hoạt động'},
        {code: 'user_not_found', message: 'không tìm thấy thông tin người đặt hàng'},
        {code: 'user_inactive', message: 'tài khoản người đặt hàng bị ngưng hoạt động'},
        {code: 'user_phone_invalid', message: 'số điện thoại người đặt hàng không chính xác'},
        {code: 'product_not_found', message: 'không tìm thấy sản phẩm'},
        {code: 'product_inactive', message: 'sản phẩm tạm ngưng hoạt động'},
        {code: 'product_invalid', message: 'sản phẩm bị lỗi'},
        {code: 'addon_category_is_required', message: 'nhóm tùy chọn bị thiếu dữ liệu'},
        {code: 'addon_category_invalid', message: 'nhóm tùy chọn bị sai dữ liệu'},
    ],
    handle: async function (arg) {
        let receiveDate = arg.shipping_receive_time;
        if (!receiveDate) {
            const time = await dao.config.getValueByKey('default_receive_time');
            receiveDate = moment().add(time, 'minute');
        }
        return await dao.user_order.create({
            store_id: arg.store_id,
            user_id: this.currentUserId,
            receive_name: arg.receive_name,
            receive_phone: arg.receive_phone,
            receive_address: arg.shipping_receive_address,
            receive_lat: arg.shipping_receive_lat,
            receive_lng: arg.shipping_receive_lng,
            receive_date: receiveDate,
            is_as_soon_as_possible: !arg.shipping_receive_time,
            note: arg.note,
            list_product: arg.list_product,
        });
    },
});

api.put({
    url: '/user/user_order',
    redmine: 506,
    tags: ['user_order'],
    summary: 'cập nhật đơn hàng',
    require_user_auth: true,
    parameter: {
        user_order_uuid: {
            required: true,
            allow_null: false,
            type: types.string({description: 'uuid đơn hàng', allowEmpty: false}),
        },
        receive_name: {
            allow_missing: true,
            type: types.string({description: 'tên người nhận hàng', allowEmpty: false}),
        },
        receive_phone: {
            allow_missing: true,
            type: types.string({description: 'số điện thoại người nhận hàng', allowEmpty: false}),
            parse: (value, config, end_point) => {
                if (util.isNullOrUndefined(value))
                    return value;
                if (!util.isPhoneNumber(value))
                    throw 'must be phone number';
                return value;
            },
        },
        receive_address: {
            allow_missing: true,
            type: types.string({description: 'địa chỉ người nhận hàng', allowEmpty: false}),
        },
        receive_lat: {
            allow_missing: true,
            type: types.number({description: 'toạ độ lat để nhận hàng'}),
        },
        receive_lng: {
            allow_missing: true,
            type: types.number({description: 'toạ độ lng để nhận hàng'}),
        },
        receive_time: {
            allow_missing: true,
            type: types.datetime({description: 'thời gian nhận hàng, để null nếu là "nhanh nhất có thể"'}),
            parse: (value) => {
                if (util.isNullOrUndefined(value))
                    return value;
                if (value.isBefore(moment()))
                    throw 'must from now or later';
                return value;
            },
        },
        note: {
            allow_missing: true,
            type: types.string({description: 'ghi chú đơn hàng'})
        },
        list_product: {
            allow_missing: true,
            type: types.list(types.object({
                product_id: {
                    required: true,
                    allow_null: false,
                    type: types.number({description: 'id sản phẩm'}),
                },
                quantity: {
                    required: true,
                    allow_null: false,
                    type: types.number({description: 'số lượng', min: 1}),
                },
                note: types.string({description: 'ghi chú'}),
                list_addon: types.list(types.object({
                    addon_id: {
                        required: true,
                        allow_null: false,
                        type: types.number({description: 'id addon'}),
                    },
                    value: {
                        required: true,
                        allow_null: false,
                        type: types.string({description: 'dữ liệu addon'}),
                    },
                }), {description: 'danh sách addon'}),
            }), {description: 'danh sách sản phẩm'})
        },
    },
    response: types.string({description: 'uuid của đơn hàng'}),
    error: [
        {code: 'user_order_not_found', message: 'không tìm thấy đơn hàng'},
        {code: 'modify_denied', message: 'đơn hàng không được phép chỉnh sửa'},
        {code: 'store_not_found', message: 'không tìm thấy cửa hàng'},
        {code: 'store_inactive', message: 'cửa hàng tạm ngưng hoạt động'},
        {code: 'merchant_not_found', message: 'không tìm thấy merchant'},
        {code: 'merchant_inactive', message: 'merchant tạm ngưng hoạt động'},
        {code: 'user_not_found', message: 'không tìm thấy thông tin người đặt hàng'},
        {code: 'user_inactive', message: 'tài khoản người đặt hàng bị ngưng hoạt động'},
        {code: 'user_phone_invalid', message: 'số điện thoại người đặt hàng không chính xác'},
        {code: 'product_not_found', message: 'không tìm thấy sản phẩm'},
        {code: 'product_inactive', message: 'sản phẩm tạm ngưng hoạt động'},
        {code: 'product_invalid', message: 'sản phẩm bị lỗi'},
        {code: 'addon_category_is_required', message: 'nhóm tùy chọn bị thiếu dữ liệu'},
        {code: 'addon_category_invalid', message: 'nhóm tùy chọn bị sai dữ liệu'},
    ],
    handle: async function (arg) {
        let userOrder = await dao.user_order.getByUuid(arg.user_order_uuid);
        if (!userOrder)
            throw {code: 'user_order_not_found'};
        if (userOrder.state !== dao.user_order.config.STATE.DRAFT || userOrder.user_id !== this.currentUserId)
            throw {code: 'modify_denied'};

        return await dao.user_order.update(
            userOrder.uuid,
            {
                receive_name: arg.receive_name,
                receive_phone: arg.receive_phone,
                receive_address: arg.receive_address,
                receive_lat: arg.receive_lat,
                receive_lng: arg.receive_lng,
                receive_date: arg.receive_time === undefined ? undefined : arg.receive_time === null ? moment() : arg.receive_time,
                is_as_soon_as_possible: arg.receive_time === undefined ? undefined : !arg.receive_time,
                note: arg.note,
                list_product: arg.list_product,
            });
    },
});

api.put({
    url: '/user/user_order/submit',
    redmine: 520,
    tags: ['user_order'],
    summary: 'xác nhận đơn hàng',
    require_user_auth: true,
    parameter: {
        user_order_uuid: {
            required: true,
            allow_null: false,
            type: types.string({description: 'uuid đơn hàng', allowEmpty: false}),
        },
        gateway_code: {
            required: true,
            allow_null: false,
            type: types.string({description: 'mã quy định phương thức thanh toán', allowEmpty: false}),
        },
        gateway_data: types.raw({description: 'dữ liệu của phương thức thanh toán'}),
    },
    response: types.object({
        user_order_uuid: types.string({description: 'uuid của đơn hàng'}),
        payment_data: types.raw({description: 'thông tin thanh toán'})
    }),
    error: [
        {code: 'user_order_not_found', message: 'không tìm thấy đơn hàng'},
        {code: 'modify_denied', message: 'đơn hàng không được phép chỉnh sửa'},
        {code: 'gateway_not_found', message: 'không tìm thấy phương thức thanh toán'},
    ],
    handle: async function (arg) {
        let userOrder = await dao.user_order.getByUuid(arg.user_order_uuid);
        if (!userOrder)
            throw {code: 'user_order_not_found'};
        if (userOrder.state !== dao.user_order.config.STATE.DRAFT || userOrder.user_id !== this.currentUserId)
            throw {code: 'modify_denied'};

        let paymentGateway = await dao.payment_gateway.getByCode(arg.gateway_code);
        if (!paymentGateway) {
            throw {code: 'gateway_not_found'};
        }

        // set state for user order
        await dao.user_order.updateState(userOrder.uuid, 'submitted');

        // create payment order
        await dao.payment_order.createByUserOrderUuid(userOrder.uuid, {
            gateway_code: arg.gateway_code,
            gateway_data: JSON.stringify(arg.gateway_data),
        });

        return {
            user_order_uuid: userOrder.uuid,
        };
    },
});

api.delete({
    url: '/user/user_order',
    redmine: 507,
    tags: ['user_order'],
    summary: 'hủy đơn hàng',
    require_user_auth: true,
    parameter: {
        user_order_uuid: {
            required: true,
            allow_null: false,
            type: types.string({description: 'uuid đơn hàng', allowEmpty: false}),
        },
    },
    response: types.string({description: 'uuid của đơn hàng'}),
    error: [
        {code: 'user_order_not_found', message: 'không tìm thấy đơn hàng'},
        {code: 'modify_denied', message: 'đơn hàng không được phép chỉnh sửa'},
    ],
    handle: async function (arg) {
        let userOrder = await dao.user_order.getByUuid(arg.user_order_uuid);
        if (util.isNullOrUndefined(userOrder))
            throw {code: 'user_order_not_found'};
        if (userOrder.state !== dao.user_order.config.STATE.DRAFT || userOrder.user_id !== this.currentUserId)
            throw {code: 'modify_denied'};

        return await dao.user_order.updateState(userOrder.uuid, 'cancelled');
    },
});