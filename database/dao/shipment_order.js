const database = require('../index');
const moment = require('moment');
const util = require('../../core/util');
const types = require('../../core/types');

const userOrderDao = require('./user_order');
const userDao = require('./user');
const storeDao = require('./store');
const merchantDao = require('./merchant');

const PREFIX = 'SO';
const TABLE = 'shipment_order';
const STATE = Object.freeze({
    NEW: 'new', // mới khởi tạo
    READY: 'ready', // driver sẵn sàng
    PICKED: 'picked', // driver đã nhận hàng
    COMPLETED: 'completed', // driver đã giao hàng cho user
    CANCELED: 'canceled', // đơn hàng bị hủy (từ user, admin, ... ko phải phía driver)
    REJECTED: 'rejected', // đơn hàng bị từ chối (từ driver, đã tiếp nhận rồi từ chối)
    EXPIRED: 'expired', // đơn hàng không được driver tiếp nhận
});
const PROVIDER = Object.freeze({
    LALAMOVE: 'lalamove',
});

module.exports = class {
    static get config() {
        return {
            PREFIX,
            STATE,
            CLOSED_STATES: [STATE.COMPLETED, STATE.CANCELED, STATE.REJECTED, STATE.EXPIRED],
            PROVIDER,
        }
    }

    static async getByUuid(uuid) {
        let deliveryDb = this.openDeliveryConnection();

        return await deliveryDb.table(TABLE).where({uuid: uuid}).first();
    }

    /** get by user order uuid
     * 
     * @param {string} user_order_uuid uuid of user_order
     * @param {string} state filter state, default STATE.ACTIVE
     * @return {object} shipment_order
     */
    static async getByUserOrderUuid(user_order_uuid, state) {
        let deliveryDb = this.openDeliveryConnection();
        if (util.isNullOrUndefined(user_order_uuid))
            throw {code: 'user_order_uuid_missing'};
        if (Object.values(STATE).includes(state)) {
            filter.state = state;
        }
        const filter = { user_order_uuid };
        return await deliveryDb.table(TABLE).where(filter).first();
    }

    static async getListProcessingOrder() {
        let deliveryDb = this.openDeliveryConnection();

        return await deliveryDb
            .table(TABLE)
            .whereIn('state', [STATE.NEW, STATE.READY, STATE.PICKED, STATE.GOING])
    }

    static async createByUserOrderUuid(user_order_uuid, {provider, provider_order_id}) {
        let deliveryDb = this.openDeliveryConnection();

        //region [validation]

        if (util.isNullOrUndefined(provider))
            throw {code: 'provider_missing'};
        if (!Object.values(PROVIDER).includes(provider))
            throw {code: 'provider_invalid'};

        if (util.isNullOrUndefined(provider_order_id))
            throw {code: 'provider_order_id_missing'};

        //endregion

        //region [get user order]

        let userOrder = await userOrderDao.getByUuid(user_order_uuid);
        if (!userOrder)
            throw {code: 'user_order_not_found'};
        if (userOrder.state === userOrderDao.config.STATE.DRAFT)
            throw {code: 'user_order_not_ready'};
        if ([userOrderDao.config.STATE.COMPLETED, userOrderDao.config.STATE.CANCELED].includes(userOrder.state))
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
                state:  STATE.NEW,
                create_date: moment().toDate(),
                estimate_date: null,
                complete_date: null,
                provider: provider,
                provider_order_id: provider_order_id,
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

        //region [get shipment order]

        let shipmentOrder = await this.dao.getByUuid(uuid);
        if (util.isNullOrUndefined(shipmentOrder))
            throw {code: 'shipment_order_not_found'};

        //endregion

        await deliveryDb.transaction(async trx => {
            // update shipment order
            let updatedData = {
                state: state,
            };
            if (state === STATE.COMPLETED)
                updatedData.complete_date = moment().toDate();

            await trx.table(TABLE)
                .update(updatedData)
                .where({
                    uuid: shipmentOrder.uuid,
                });
        });

        return shipmentOrder.uuid;
    }
};

database.register(module.exports);