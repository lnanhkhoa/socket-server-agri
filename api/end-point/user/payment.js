const api = require('../../../api');
const types = require('../../../core/types');
const dao = require('../../../database').dao;
const util = require('../../../core/util');
const moment = require('moment');

api.get({
    url: '/user/payment/gateway',
    redmine: 559,
    tags: ['payment'],
    summary: 'lấy thông tin cổng thanh toán',
    require_user_auth: false,
    response: types.list(types.object({
        code: types.string({description: 'mã cổng thanh toán'}),
        name: types.string({description: 'tên cổng thanh toán'}),
    })),
    handle: async function (arg) {
        const gateways = await dao.payment_gateway.getListActive();
        return gateways.map(e => {
            return {
                code: e.code,
                name: e.name,
            }
        });
    },
});