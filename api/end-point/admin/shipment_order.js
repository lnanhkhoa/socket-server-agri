const api = require('../../../api');
const types = require('../../../core/types');
const dao = require('../../../database').dao;
const util = require('../../../core/util');
const shipment_provider = require('../../../core/shipment_provider');
const moment = require('moment');

api.post({
    url: '/admin/shipment_order/lalamove',
    redmine: 546,
    tags: ['shipment_order'],
    summary: 'khởi tạo đơn hàng lalamove',
    require_admin_auth: true,
    parameter: {
        user_order_uuid: {
            required: true,
            allow_null: false,
            type: types.string({description: 'uuid đơn hàng', allowEmpty: false}),
        },
    },
    response: types.object({
        provider: types.string({description: 'provider dùng để giao hàng'}),
        shipment_order_uuid: types.string({description: 'uuid của đơn hàng'}),
        provider_order_id: types.string({description: 'order id của provider'}),
    }),
    error: [
        {code: 'user_order_not_found', message: 'không tìm thấy đơn hàng'},
        {code: 'user_order_not_ready', message: 'đơn hàng chưa được xác nhận'},
        {code: 'user_order_closed', message: 'đơn hàng đã đóng'},
        {code: 'store_not_found', message: 'không tìm thông tin cửa hàng'},
        {code: 'store_inactive', message: 'cửa hàng bị khóa'},
        {code: 'merchant_not_found', message: 'không tìm thông tin merchant'},
        {code: 'merchant_inactive', message: 'merchant bị khóa'},
        {code: 'user_not_found', message: 'không tìm thông tin người đặt'},
        {code: 'user_inactive', message: 'người đặt bị khóa'},
        {code: 'lalamove_error', message: 'lỗi từ phía lalamove'},
    ],
    handle: async function (arg) {
        let userOrder = await dao.user_order.getByUuid(arg.user_order_uuid);
        if (!userOrder)
            throw {code: 'user_order_not_found'};
        if (userOrder.state === dao.user_order.config.STATE.DRAFT)
            throw {code: 'user_order_not_ready'};
        if (dao.user_order.config.CLOSED_STATES.includes(userOrder.state))
            throw {code: 'user_order_closed'};

        let lalamoveOrder;
        try {
            lalamoveOrder = await shipment_provider.lalamove.createNewOrder({user_order_uuid: userOrder.uuid});
        } catch (e) {
            throw {code: 'lalamove_error', data: e};
        }

        let providerOrderId = lalamoveOrder.customerOrderId;
        let shipmentOrderUuid = await dao.shipment_order.createByUserOrderUuid(userOrder.uuid, {
            provider: shipment_provider.lalamove.config.PROVIDER,
            provider_order_id: providerOrderId,
        });

        return {
            shipment_order_uuid: shipmentOrderUuid,
            provider: shipment_provider.lalamove.config.PROVIDER,
            provider_order_id: providerOrderId,
        };
    },
});