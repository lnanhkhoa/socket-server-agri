const api = require('../../../api');
const types = require('../../../core/types');
const dao = require('../../../database').dao;
const util = require('../../../core/util');
const moment = require('moment');

api.post({
    enable: false,
    url: '/admin/merchant_order',
    redmine: 548,
    tags: ['merchant_order'],
    summary: 'khởi tạo đơn hàng merchant',
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
        {code: 'user_order_closed', message: 'đơn hàng đã đóng'},
        {code: 'store_not_found', message: 'không tìm thông tin cửa hàng'},
        {code: 'store_inactive', message: 'cửa hàng bị khóa'},
        {code: 'merchant_not_found', message: 'không tìm thông tin merchant'},
        {code: 'merchant_inactive', message: 'merchant bị khóa'},
        {code: 'user_not_found', message: 'không tìm thông tin người đặt'},
        {code: 'user_inactive', message: 'người đặt bị khóa'},
    ],
    handle: async function (arg) {
        let userOrder = await dao.user_order.getByUuid(arg.user_order_uuid);
        if (!userOrder)
            throw {code: 'user_order_not_found'};
        if (userOrder.state === dao.user_order.config.STATE.DRAFT)
            throw {code: 'user_order_not_ready'};
        if ([dao.user_order.config.STATE.COMPLETED, dao.user_order.config.STATE.CANCELED].includes(userOrder.state))
            throw {code: 'user_order_closed'};

        return await dao.merchant_order.createByUserOrderUuid(userOrder.uuid);
    },
});