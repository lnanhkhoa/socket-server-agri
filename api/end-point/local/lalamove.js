const api = require('../../../api');
const types = require('../../../core/types');
const dao = require('../../../database').dao;
const util = require('../../../core/util');
const moment = require('moment');
const redis = require('../../../core/redis');

api.get({
    url: '/local/lalamove/sync_status',
    redmine: 544,
    tags: ['local'],
    summary: 'đồng bộ đơn hàng từ Lalamove',
    require_secret_key: true,
    handle: async function (arg) {
        const unlock = await redis.lock('lalamove_sync_status');
        try {
            let processingOrders = await dao.shipment_order.getListProcessingOrder();

            let tasks = processingOrders.map(order => new Promise(async (res, rej) => {
                const lalamoveInfo = await util.lalamove('getOrderStatus', order.provider_order_id);

                let result, uoState, soState, poState;
                let uoUuid = order.user_order_uuid;
                let soUuid = order.uuid;
                let poUuid = dao.payment_order.getActiveByUserOrderUuid(uoUuid);
                poUuid = poUuid ? poUuid.uuid : null;

                switch (lalamoveInfo.status) {
                    case 'ON_GOING':
                        uoState = dao.user_order.config.STATE.ASSIGNED;
                        soState = dao.shipment_order.config.STATE.READY;
                        break;
                    case 'PICKED_UP':
                        uoState = dao.user_order.config.STATE.PICKED;
                        soState = dao.shipment_order.config.STATE.PICKED;
                        break;
                    case 'COMPLETED':
                        uoState = dao.user_order.config.STATE.COMPLETED;
                        soState = dao.shipment_order.config.STATE.COMPLETED;
                        poState = dao.user_order.config.STATE.COMPLETED;
                        break;
                    case 'EXPIRED':
                        uoState = dao.user_order.config.STATE.EXPIRED;
                        soState = dao.shipment_order.config.STATE.EXPIRED;
                        poState = dao.user_order.config.STATE.EXPIRED;
                        break;
                    case 'CANCELED':
                        uoState = dao.user_order.config.STATE.CANCELED;
                        soState = dao.shipment_order.config.STATE.CANCELED;
                        poState = dao.user_order.config.STATE.CANCELED;
                        break;
                    case 'REJECTED':
                        uoState = dao.user_order.config.STATE.REJECTED;
                        soState = dao.shipment_order.config.STATE.REJECTED;
                        poState = dao.user_order.config.STATE.REJECTED;
                        break;
                }

                if (!soState || soState === order.state) {
                    result = {
                        user_order_uuid: uoUuid,
                        user_order_state: 'no_change',
                        shipment_order_uuid: soUuid,
                        shipment_order_state: 'no_change',
                        payment_order_uuid: poUuid,
                        payment_order_state: 'no_change',
                    };
                } else {
                    if (uoUuid && uoState)
                        await dao.user_order.updateState(uoUuid, uoState);
                    else
                        uoState = 'no_change';

                    if (soUuid && soState)
                        await dao.shipment_order.updateState(soUuid, soState);
                    else
                        soState = 'no_change';

                    if (poUuid && poState)
                        await dao.payment_order.updateState(poUuid, poState);
                    else
                        poState = 'no_change';

                    result = {
                        user_order_uuid: uoUuid,
                        user_order_state: uoState,
                        shipment_order_uuid: soUuid,
                        shipment_order_state: soState,
                        payment_order_uuid: poUuid,
                        payment_order_state: poState,
                    };
                }

                return result;
            }));

            return await Promise.all(tasks);
        } catch (e) {
            throw {code: 'lalamove_error', data: e};
        } finally {
            unlock();
        }
    },
});