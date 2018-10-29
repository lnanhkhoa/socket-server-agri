const database = require('../index');
const util = require('../../core/util');
const types = require('../../core/types');
const moment = require('moment');

const userOrderDao = require('./user_order');
const shiptmentOrderDao = require('./shipment_order');
const userDao = require('./user');
const storeDao = require('./store');
const merchantDao = require('./merchant');
const paymentGatewayDao = require('./payment_gateway');

const PREFIX = 'PO';
const TABLE = 'payment_order';
const STATE = Object.freeze({
    NEW: 'new',
    WAIT: 'wait',
    COMPLETED: 'completed',
    CANCELED: 'canceled',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
});

module.exports = class {
    static get config() {
        return {
            PREFIX,
            STATE,
            CLOSED_STATES: [STATE.COMPLETED, STATE.CANCELED, STATE.REJECTED, STATE.EXPIRED]
        }
    }

    static async getActiveByUserOrderUuid(user_order_uuid) {
        let deliveryDb = this.openDeliveryConnection();

        return await deliveryDb.table(TABLE)
            .select('payment_order.*')
            .join('user_order', 'user_order.uuid', 'payment_order.user_order_uuid')
            .where({
                'user_order.uuid': user_order_uuid,
            })
            .whereNotIn('payment_order.state', this.dao.config.CLOSED_STATES)
            .first();
    }

    static async getByUuid(uuid) {
        let deliveryDb = this.openDeliveryConnection();

        return await deliveryDb.table(TABLE).where({uuid: uuid}).first();
    }

    static async createByUserOrderUuid(user_order_uuid, {gateway_code, gateway_data}) {
        let deliveryDb = this.openDeliveryConnection();

        //region [get user order]

        let userOrder = await userOrderDao.getByUuid(user_order_uuid);
        if (!userOrder)
            throw {code: 'user_order_not_found'};
        if (['completed', 'cancelled'].includes(userOrder.state))
            throw {code: 'user_order_closed'};

        //endregion

        //region [get user]

        let user = await userDao.getById(userOrder.user_id);
        if (util.isNullOrUndefined(user))
            throw {code: 'user_not_found'};
        if (!user.active)
            throw {code: 'user_inactive'};

        //endregion

        //region [get store]

        let store = await storeDao.getById(userOrder.store_id);
        if (util.isNullOrUndefined(store))
            throw {code: 'store_not_found'};
        if (store.state !== storeDao.config.STATE.ACTIVE)
            throw {code: 'store_inactive'};

        //endregion

        //region [get merchant]

        let merchant = await merchantDao.getById(userOrder.merchant_id);
        if (util.isNullOrUndefined(merchant))
            throw {code: 'merchant_not_found'};
        if (merchant.status !== merchantDao.config.STATE.ACTIVE)
            throw {code: 'merchant_inactive'};

        //endregion

        //region [get gateway]

        let gateway = await paymentGatewayDao.getByCode(gateway_code);
        if (util.isNullOrUndefined(gateway))
            throw {code: 'gateway_not_found'};
        if (merchant.status !== paymentGatewayDao.config.STATE.ACTIVE)
            throw {code: 'gateway_inactive'};

        //endregion

        return await deliveryDb.table(TABLE).insertWithUuid({
            generator: () => util.randomString({length: 10, prefix: PREFIX}),
            values: uuid => ({
                uuid: uuid,
                user_order_uuid: userOrder.uuid,
                gateway_code: gateway.code,
                state: STATE.NEW,
                create_date: moment().toDate(),
                expiry_date: moment().add(1, 'days').toDate(),
                complete_date: null,
                money: userOrder.money,
                data: gateway_data,
            }),
        });
    }

    /** update state
     * 
     * @param {string} uuid uuid of payment_order
     * @param {string} state 'new', 'wait', 'completed', 'canceled', 'rejected', 'expired'
     * @returns {string} payment_order.uuid
     */
    static async updateState(uuid, state) {
        let deliveryDb = this.openDeliveryConnection();

        //region [validation]

        if (util.isNullOrUndefined(uuid))
            throw {code: 'uuid_missing'};

        if (util.isNullOrUndefined(state))
            throw {code: 'state_missing'};
        if (typeof state !== 'string' || !Object.values(STATE).includes(state))
            throw {code: 'state_invalid'};

        //endregion

        //region [get payment order]

        const paymentOrder = await this.dao.getByUuid(uuid);
        if (util.isNullOrUndefined(paymentOrder))
            throw {code: 'payment_order_not_found'};

        //endregion

        await deliveryDb.transaction(async trx => {
            // update payment order
            let updatedData = {
                state: state,
            };
            if (state === STATE.COMPLETED)
                updatedData.complete_date = moment().toDate();

            await trx.table(TABLE)
                .update(updatedData)
                .where({
                    uuid: paymentOrder.uuid,
                });
        });

        return paymentOrder.uuid;
    }
};

database.register(module.exports);