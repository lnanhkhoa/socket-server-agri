const database = require('../index');
const util = require('../../core/util');
const types = require('../../core/types');
const moment = require('moment');

const userOrderDao = require('./user_order');
const shiptmentOrderDao = require('./shipment_order');
const userDao = require('./user');
const storeDao = require('./store');
const merchantDao = require('./merchant');

const PREFIX = 'MO';
const TABLE = 'merchant_order';
const STATE = Object.freeze({
    NEW: 'new',
    CONFIRMED: 'confirmed',
    DOING: 'doing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
});

module.exports = class {
    static get config() {
        return {
            PREFIX,
            STATE,
        }
    }

    static async getByUuid(uuid) {
        let deliveryDb = this.openDeliveryConnection();

        return await deliveryDb.table(TABLE).where({uuid: uuid}).first();
    }

    static async createByUserOrderUuid(user_order_uuid) {
        let deliveryDb = this.openDeliveryConnection();

        //region [get user order]

        let userOrder = await userOrderDao.getByUuid(user_order_uuid);
        if (!userOrder)
            throw {code: 'user_order_not_found'};
        if (userOrder.state === 'draft')
            throw {code: 'user_order_not_ready'};
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

        return await deliveryDb.table(TABLE).insertWithUuid({
            generator: () => util.randomString({length: 10, prefix: PREFIX}),
            values: uuid => ({
                uuid: uuid,
                user_order_uuid: userOrder.uuid,
                state: STATE.NEW,
                create_date: moment().toDate(),
                estimate_date: null,
                complete_date: null,
                merchant_id: merchant.id,
                store_id: store.id,
                note: userOrder.note,
            }),
        });
    }

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

        //region [get merchant order]

        const merchantOrder = await this.dao.getByUuid(uuid);
        if (util.isNullOrUndefined(merchantOrder))
            throw {code: 'merchant_order_not_found'};

        //endregion

        await deliveryDb.transaction(async trx => {
            // update merchant order
            let updatedData = {
                state: state,
            };
            if (state === STATE.COMPLETED)
                updatedData.complete_date = moment().toDate();

            await trx.table(TABLE)
                .update(updatedData)
                .where({
                    uuid: merchantOrder.uuid,
                });
        });

        return merchantOrder.uuid;
    }
};

database.register(module.exports);