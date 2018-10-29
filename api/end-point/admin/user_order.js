const api = require('../../../api');
const types = require('../../../core/types');
const dao = require('../../../database').dao;
const util = require('../../../core/util');
const provider = require('../../../core/shipment_provider');
const moment = require('moment');
const lalamove = require('../../../core/shipment_provider/lalamove');

api.post({
    url: '/admin/user_order/confirm',
    redmine: 551,
    tags: ['user_order'],
    summary: 'xác nhận đơn hàng của user',
    require_admin_auth: true,
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
        {code: 'user_order_not_ready', message: 'đơn hàng chưa được xác nhận'},
        {code: 'payment_not_found', message: 'không tìm thấy hóa đơn'},
    ],
    handle: async function (arg) {
        let userOrder = await dao.user_order.getByUuid(arg.user_order_uuid);
        if (!userOrder)
            throw {code: 'user_order_not_found'};
        if (userOrder.state !== dao.user_order.config.STATE.SUBMITTED)
            throw {code: 'user_order_not_ready'};

        let paymentOrder = await dao.payment_order.getActiveByUserOrderUuid(userOrder.uuid);
        if (!paymentOrder)
            throw {code: 'payment_order_not_found'};

        // set state user order
        await dao.user_order.updateState(userOrder.uuid, dao.user_order.config.STATE.CONFIRMED);

        // set state payment order
        await dao.payment_order.updateState(paymentOrder.uuid, dao.payment_order.config.STATE.WAIT);

        return userOrder.uuid;
    },
});

api.put({
    url: '/admin/user_order',
    redmine: 560,
    tags: ['user_order'],
    summary: 'xác nhận đơn hàng của user',
    require_admin_auth: true,
    parameter: {
        user_order_uuid: {
            required: true,
            allow_null: false,
            type: types.string({description: 'uuid đơn hàng', allowEmpty: false}),
        },
        receive_name: {
            allow_missing: true,
            type: types.string({description: 'tên người nhận hàng', allowEmpty: false, allow_null: false})
        },
        receive_phone: {
            allow_missing: true,
            type: types.string({description: 'số điện thoại người nhận hàng', allowEmpty: false, allow_null: false})
        },
        receive_address: {
            allow_missing: true,
            type: types.string({description: 'địa chỉ nhận hàng', allowEmpty: false, allow_null: false})
        },
        receive_lat: {
            allow_missing: true,
            type: types.number({description: 'tọa độ lat nhận hàng', allowEmpty: false, allow_null: false}),
        },
        receive_lng: {
            allow_missing: true,
            type: types.number({description: 'tọa độ lng nhận hàng', allowEmpty: false, allow_null: false})
        },
        note: types.string({description: 'ghi chú đơn hàng', allowEmpty: false}),
        list_product: types.list(types.object({
            product_id: types.string({description: 'id sản phẩm / món ăn', allowEmpty: false, require: true, allow_null: false}),
            quantity: types.string({description: 'tọa độ lat nhận hàng', allowEmpty: false, require: true, allow_null: false}),
            note: {
                allow_missing: true,
                type: types.string({description: 'ghi chú', allowEmpty: false, allow_null: false}),
            },
            list_addon: types.list(types.object({
                addon_id: types.string({description: 'id addon', allowEmpty: false, require: true, allow_null: false}),
                value: types.string({description: 'dữ liệu addon', allowEmpty: false, allow_null: false, require: true}),
            }), {description: 'tọa độ lat nhận hàng', allowEmpty: false}),
        }), {description: 'danh sách sản phẩm / món ăn'}),
    },
    response: types.string({description: 'uuid của đơn hàng'}),
    error: [
        {code: 'user_order_not_found', message: 'không tìm thấy đơn hàng'},
        {code: 'user_order_immutable', message: 'đơn hàng trong trạng thái không thể thay đổi'},
    ],
    handle: async function (arg) {
        //region [validate admin can't updateState draft, complete, cancel]
        let userOrder = await dao.user_order.getByUuid(arg.user_order_uuid);
        if (!userOrder)
            throw {code: 'user_order_not_found'};
        const STATE = dao.user_order.config.STATE;
        if ([STATE.DRAFT, STATE.COMPLETED, STATE.CANCELED].includes(userOrder.state)) {
            throw {code: 'user_order_immutable'};
        }
        //endregion

        //region [cancel provider (lalamove) order]
        const shipementOrder = await dao.shipment_order.getByUserOrderUuid(userOrder.uuid);
        const providerOrderId = shipementOrder.provider_order_id;
        let provider = null;
        switch (shipementOrder.provider) {
            case dao.shipment_order.config.PROVIDER.LALAMOVE:
                provider = lalamove;
                break;
            default:
                //todo: add undefine_common_error here
                break;
        }
        
        await provider.cancelOrder(providerOrderId);
        //endregion

        //region [cancel shiptment_order]
        await dao.shipment_order.updateState(shipementOrder.uuid, dao.shipment_order.config.STATE.CANCELED);
        //endregion
        
        //region [update user_order]
        await dao.user_order.update(userOrder.uuid, arg);
        //endregion

        const newUserOrder = dao.user_order.getByUuid(arg.user_order_uuid);
        if (newUserOrder.money !== userOrder.money) {
            //region [cancel and create new payment_order]
            const PAYMENT_STATE = dao.payment_order.config.STATE;
            const paymentOrder = await dao.payment_order.getActiveByUserOrderUuid(userOrder.uuid);
            await dao.payment_order.updateState(paymentOrder.uuid, PAYMENT_STATE.CANCELED);
            await dao.payment_order.createByUserOrderUuid(newUserOrder.uuid);
            //endregion

            //region [create new shipment_order and provider order]
            await dao.shipment_order.createByUserOrderUuid(arg.user_order_uuid);
            await provider.createNewOrder(arg.user_order_uuid)
            //endregion   
        }

        return userOrder.uuid;
    },
});