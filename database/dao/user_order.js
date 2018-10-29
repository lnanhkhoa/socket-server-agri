const database = require('../index');
const util = require('../../core/util');
const types = require('../../core/types');
const moment = require('moment');
const socket = require('../../socket');

const configDao = require('./config');
const userDao = require('./user');
const storeDao = require('./store');
const merchantDao = require('./merchant');
const productDao = require('./product');
const addonDao = require('./product_addon');
const addonCategoryDao = require('./product_addon_category');

const PREFIX = 'UO';
const TABLE = 'user_order';
const STATE = Object.freeze({
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    CONFIRMED: 'confirmed',
    ASSIGNED: 'assigned',
    PICKED: 'picked',
    COMPLETED: 'completed',
    CANCELED: 'canceled',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
});

async function prepareListProduct(list_product, store_id) {
    if (util.isNullOrEmpty(list_product))
        return [];

    if (!Array.isArray(list_product) || list_product.some(x => !x.hasOwnProperty('product_id') || !x.hasOwnProperty('quantity') || x.quantity <= 0))
        throw {code: 'list_product_invalid'};

    let result = [];
    for (let item of list_product) {
        let product = await productDao.getById(item.product_id);
        if (!product)
            throw {code: 'product_not_found', data: item.product_id};
        if (product.state !== productDao.config.STATE.ACTIVE)
            throw {code: 'product_inactive', data: {id: product.id, name: product.name}};
        if (product.store_id !== store_id)
            throw {code: 'product_invalid', data: {id: product.id, name: product.name}};

        let list_addon = [];
        let addonCategories = await addonCategoryDao.getListByProductId(product.id, {state: addonCategoryDao.config.STATE.ACTIVE});
        for (let addonCategory of addonCategories) {
            let addons = await addonDao.getListByCategoryId(addonCategory.id, {state: addonDao.config.STATE.ACTIVE});
            let foundAddons = item.list_addon ? item.list_addon.filter(x => addons.some(y => y.id === x.addon_id)) : [];

            // data type
            let type = util.getTypeClassByName(addonCategory.data_type);
            if (!type)
                throw {code: 'addon_category_invalid', data: {id: addonCategory.id, name: addonCategory.name}};

            // check duplicate
            for (let item of foundAddons) {
                if (foundAddons.filter(x => x.addon_id === item.addon_id).length > 1)
                    throw {code: 'addon_category_invalid', data: {id: addonCategory.id, name: addonCategory.name}};
            }

            // check required
            if (foundAddons.length === 0 && addonCategory.required && !addons.some(x => !util.isNullOrUndefined(x.default_value)))
                throw {code: 'addon_category_is_required', data: {id: addonCategory.id, name: addonCategory.name}};

            // default value
            if (foundAddons.length === 0) {
                let addon = addons.filter(x => !util.isNullOrUndefined(x.default_value))[0];
                if (addon) {
                    let defaultValue = type._parse(addon.default_value);
                    if (defaultValue === undefined)
                        throw {code: 'addon_category_invalid', data: {id: addonCategory.id, name: addonCategory.name}};

                    list_addon.push({
                        category: addonCategory,
                        addon: addon,
                        value: defaultValue,
                    });
                    continue;
                }
            }

            // check multichoice
            if (!addonCategory.multichoice && foundAddons.length > 1)
                throw {code: 'addon_category_invalid', data: {id: addonCategory.id, name: addonCategory.name}};

            // get value
            for (let item of foundAddons) {
                let addon = addons.filter(x => x.id === item.addon_id)[0];
                let value = type._parse(item.value);

                // check number value
                if (addonCategory.data_type === 'number') {
                    if (!util.isNullOrUndefined(addon.min_number_value) && value < addon.min_number_value)
                        throw {code: 'addon_category_invalid', data: {id: addonCategory.id, name: addonCategory.name}};
                    if (!util.isNullOrUndefined(addon.max_number_value) && value > addon.max_number_value)
                        throw {code: 'addon_category_invalid', data: {id: addonCategory.id, name: addonCategory.name}};
                }

                list_addon.push({
                    category: addonCategory,
                    addon: addon,
                    value: value,
                });
            }

            // check number value
            if (addonCategory.data_type === 'number') {
                let totalQuantity = 0;
                for (let addon of list_addon)
                    totalQuantity += addon.value;

                if (!util.isNullOrUndefined(addonCategory.min_total_number_value) && totalQuantity < addonCategory.min_total_number_value)
                    throw {code: 'addon_category_invalid', data: {id: addonCategory.id, name: addonCategory.name}};
                if (!util.isNullOrUndefined(addonCategory.max_total_number_value) && totalQuantity > addonCategory.max_total_number_value)
                    throw {code: 'addon_category_invalid', data: {id: addonCategory.id, name: addonCategory.name}};
            }
        }

        result.push({
            product: product,
            list_addon: list_addon,
            quantity: item.quantity,
            note: item.note,
        })
    }

    for (let item of result) {
        item.price = item.product.price;

        for (let addon of item.list_addon) {
            if (addon.category.data_type === 'boolean' && addon.value === true)
                item.price += addon.addon.price_modifier;
            else if (addon.category.data_type === 'number')
                item.price += addon.addon.price_modifier * addon.value;
        }

        if (item.price < 0)
            item.price = 0;
    }

    return result;
}

async function calcQuotation(user_order, {list_product, quotation_codes}) {
    if (!quotation_codes)
        quotation_codes = ['product_money', 'service_money', 'ship_money'];

    let result = [];
    let store = await storeDao.getById(user_order.store_id);

    //region [product money]

    let productMoney;

    if (quotation_codes.includes('product_money')) {
        productMoney = {
            code: 'product_money',
            name: 'Tạm tính',
            money: 0,
        };

        if (!list_product)
            list_product = await require('./user_order').getListProduct(user_order.uuid);

        for (let product of list_product)
            productMoney.money += product.price * product.quantity;

        result.push(productMoney);
    }
    else {
        let quotations = await this.dao.getListQuotation(userOrder.uuid);
        productMoney = quotations.filter(x => x.code === 'product_money')[0];
    }

    if (!productMoney)
        productMoney = {
            code: 'product_money',
            name: 'Tổng sản phẩm',
            money: 0,
        };

    //endregion

    if (quotation_codes.includes('service_money')) {
        let serviceMoney = {
            code: 'service_money',
            name: 'Phí dịch vụ',
            money: 0,
        };

        let minMoneyToFreeService = store.use_local_service_price ? store.min_money_to_free_service_price : parseInt(await configDao.getValueByKey('default_min_money_to_free_service_price'));
        if (productMoney.money >= minMoneyToFreeService)
            serviceMoney.money = 0;
        else {
            let servicePrice;

            if (store.service_price_type === 'fixed')
                servicePrice = store.use_local_service_price ? store.service_price_fixed : parseInt(await configDao.getValueByKey('default_service_price_fixed'));
            else if (store.service_price_type === 'percent') {
                servicePrice = store.use_local_service_price ? store.service_price_percent : parseInt(await configDao.getValueByKey('default_service_price_percent'));
                servicePrice = productMoney.money * servicePrice / 100;
            }

            if (servicePrice)
                serviceMoney.money = servicePrice;
        }

        result.push(serviceMoney);
    }

    if (quotation_codes.includes('ship_money')) {
        let shipMoney = {
            code: 'ship_money',
            name: 'Phí giao hàng',
            money: 0,
        };

        let minMoneyToFreeShip = store.use_local_ship_price ? store.min_money_to_free_ship_price : parseInt(await configDao.getValueByKey('default_min_money_to_free_ship_price'));
        if (shipMoney.money >= minMoneyToFreeShip)
            shipMoney.money = 0;
        else {
            let shipPrice;

            if (store.ship_price_type === 'fixed')
                shipPrice = store.use_local_ship_price ? store.ship_price_fixed : parseInt(await configDao.getValueByKey('default_ship_price_fixed'));
            else if (store.ship_price_type === 'percent') {
                shipPrice = store.use_local_ship_price ? store.ship_price_percent : parseInt(await configDao.getValueByKey('default_ship_price_percent'));
                shipPrice = productMoney.money * shipPrice / 100;
            }

            if (shipPrice) {
                let distance = util.calcDistanceFromLatLngInKm(store.lat, store.lng, user_order.receive_lat, user_order.receive_lng);
                shipMoney.money = shipPrice * Math.ceil(distance);
                shipMoney.data = {
                    distanceInKm: distance,
                }
            }
        }

        result.push(shipMoney);
    }

    return result;
}

async function calcStateEndDateEstimate(user_order, next_state) {
    if (![STATE.CONFIRMED, STATE.ASSIGNED, STATE.PICKED, STATE.COMPLETED].includes(next_state))
        return null;

    if (next_state === STATE.CONFIRMED) {
        let user_order_estimate_confirmed = parseInt(await configDao.getValueByKey('user_order_estimate_confirmed'));
        return moment().add(user_order_estimate_confirmed, 'minutes');
    }

    if (next_state === STATE.ASSIGNED) {
        let user_order_estimate_assigned = parseInt(await configDao.getValueByKey('user_order_estimate_assigned'));
        return moment().add(user_order_estimate_assigned, 'minutes');
    }

    if (next_state === STATE.PICKED) {
        let user_order_estimate_picked = parseInt(await configDao.getValueByKey('user_order_estimate_picked'));
        return moment().add(user_order_estimate_picked, 'minutes');
    }

    if (next_state === STATE.COMPLETED) {
        let user_order_estimate_completed = parseInt(await configDao.getValueByKey('user_order_estimate_completed'));
        return moment().add(user_order_estimate_completed, 'minutes');
    }
}

module.exports = class {
    static get config() {
        return {
            PREFIX,
            STATE,
            CLOSED_STATES: [STATE.COMPLETED, STATE.CANCELED, STATE.REJECTED, STATE.EXPIRED]
        };
    }

    static async getByUuid(uuid) {
        let deliveryDb = this.openDeliveryConnection();

        return await deliveryDb.table(TABLE).where({uuid: uuid}).first();
    }

    static async getCountTotalQuantity(uuid) {
        let deliveryDb = this.openDeliveryConnection();

        let data = await deliveryDb.table('user_order_line')
            .where({user_order_uuid: uuid})
            .sum('quantity');

        return data[0]['sum(`quantity`)'];
    }

    static async getPage({page, page_size, sort, user_id, create_date_from, create_date_to, complete_date_from, complete_date_to, state}) {
        let deliveryDb = this.openDeliveryConnection();

        let query = deliveryDb.table(TABLE);

        if (user_id)
            query.where({user_id: user_id});
        if (create_date_from)
            query.whereRaw('create_date >= ?', [create_date_from.toDate()]);
        if (create_date_to)
            query.whereRaw('create_date <= ?', [create_date_to.toDate()]);
        if (complete_date_from)
            query.whereRaw('complete_date >= ?', [complete_date_from.toDate()]);
        if (complete_date_to)
            query.whereRaw('complete_date <= ?', [complete_date_to.toDate()]);
        if (state)
            query.where({state: state});

        if (sort)
            query = query.sort(sort);

        return await query.paging(page, page_size);
    }

    static async getListQuotation(uuid) {
        let deliveryDb = this.openDeliveryConnection();

        return await deliveryDb.table('user_order_quotation')
            .where({user_order_uuid: uuid});
    }

    static async getListProduct(uuid) {
        let deliveryDb = this.openDeliveryConnection();

        let orderLines = await deliveryDb.table('user_order_line')
            .where({user_order_uuid: uuid});

        let result = [];
        for (let item of orderLines) {
            let addons = await deliveryDb.table('user_order_addon')
                .where({user_order_line_id: item.id});

            let list_addon = [];
            for (let addon of addons) {
                let type = util.getTypeClassByName(addon.data_type);

                list_addon.push({
                    addon_id: addon.addon_id,
                    addon_name: addon.addon_name,
                    addon_category_id: addon.category_id,
                    addon_category_name: addon.category_name,
                    data_type: addon.data_type,
                    value: type._parse(addon.value),
                })
            }

            result.push({
                id: item.product_id,
                name: item.product_name,
                price: item.price,
                quantity: item.quantity,
                note: item.note,
                list_addon: list_addon,
            });
        }

        return result;
    }

    static async getListTracking(uuid) {
        let deliveryDb = this.openDeliveryConnection();

        return await deliveryDb.table('user_order_tracking')
            .where({user_order_uuid: uuid})
            .orderBy('start_date', 'desc')
    }

    static async create({store_id, user_id, receive_name, receive_phone, receive_address, receive_lat, receive_lng, receive_date, is_as_soon_as_possible, note, list_product}) {
        let deliveryDb = this.openDeliveryConnection();

        //region [validation]

        if (util.isNullOrUndefined(store_id))
            throw {code: 'store_id_missing'};

        if (util.isNullOrUndefined(user_id))
            throw {code: 'user_id_missing'};

        if (util.isNullOrEmpty(receive_name))
            throw {code: 'receive_name_missing'};

        if (!util.isPhoneNumber(receive_phone))
            throw {code: 'receive_phone_invalid'};

        if (util.isNullOrEmpty(receive_address))
            throw {code: 'receive_address_missing'};

        if (!util.isDatetime(receive_date))
            throw {code: 'receive_date_invalid'};


        if (util.isNullOrEmpty(note))
            note = null;

        //endregion

        //region [get user]

        let user = await userDao.getById(user_id);
        if (util.isNullOrUndefined(user))
            throw {code: 'user_not_found'};
        if (!user.active)
            throw {code: 'user_inactive'};
        if (!util.isPhoneNumber(user.phone))
            throw {code: 'user_phone_invalid'};

        //endregion

        //region [get store]

        let store = await storeDao.getById(store_id);

        if (util.isNullOrUndefined(store))
            throw {code: 'store_not_found'};
        if (store.state !== storeDao.config.STATE.ACTIVE)
            throw {code: 'store_inactive'};

        //endregion

        //region [get merchant]

        let merchant = await merchantDao.getById(store.merchant_id);
        if (util.isNullOrUndefined(merchant))
            throw {code: 'merchant_not_found'};
        if (merchant.status !== merchantDao.config.STATE.ACTIVE)
            throw {code: 'merchant_inactive'};

        //endregion

        //region [prepare product]

        if (util.isNullOrEmpty(list_product))
            throw {code: 'list_product_missing'};
        let products = await prepareListProduct(list_product, store.id);

        //endregion

        let orderUuid = null;
        await deliveryDb.transaction(async trx => {
            //region [create user order]

            orderUuid = await trx.table(TABLE).insertWithUuid({
                generator: () => util.randomString({length: 10, prefix: PREFIX}),
                values: uuid => ({
                    uuid: uuid,
                    state: STATE.DRAFT,
                    create_date: moment().toDate(),
                    merchant_id: merchant.id,
                    store_id: store.id,
                    user_id: user.id,
                    receive_name: receive_name,
                    receive_phone: receive_phone,
                    receive_address: receive_address,
                    receive_lat: receive_lat,
                    receive_lng: receive_lng,
                    receive_date: receive_date.toDate(),
                    is_as_soon_as_possible: is_as_soon_as_possible,
                    note: note,
                    money: 0,
                    cashback: 0,
                }),
            });
            let userOrder = await trx.table(TABLE).where({uuid: orderUuid}).first();

            //endregion

            //region [create user order line]

            for (let item of products) {
                let lineId = await trx.table('user_order_line').insert({
                    user_order_uuid: userOrder.uuid,
                    product_id: item.product.id,
                    product_name: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                    note: item.note,
                });
                lineId = lineId[0];

                for (let addonItem of item.list_addon) {
                    await trx.table('user_order_addon').insert({
                        user_order_line_id: lineId,
                        product_id: item.product.id,
                        addon_id: addonItem.addon.id,
                        category_name: addonItem.category.name,
                        addon_name: addonItem.addon.name,
                        data_type: addonItem.category.data_type,
                        value: addonItem.value,
                    });
                }
            }

            //endregion

            //region [quotation & cashback]

            let quotations = await calcQuotation(userOrder, {list_product: products});

            let money = 0;
            for (let quotation of quotations) {
                money += quotation.money;

                await trx.table('user_order_quotation').insert({
                    user_order_uuid: userOrder.uuid,
                    code: quotation.code,
                    name: quotation.name,
                    money: quotation.money,
                    data: quotation.data,
                });
            }

            let cashback = 0;
            if (store.cashback_type === storeDao.config.CASHBACK_TYPE.FIXED)
                cashback = store.cashback_price;
            else
                cashback = Math.floor(store.cashback_price * money / 100);

            await trx.table(TABLE)
                .update({
                    money: money,
                    cashback: cashback,
                })
                .where({
                    uuid: userOrder.uuid,
                });

            //endregion

            //region [create user order tracking]

            await trx.table('user_order_tracking').insert({
                state: STATE.DRAFT,
                user_order_uuid: orderUuid,
                start_date: moment().toDate(),
            });

            //endregion
        });

        return orderUuid;
    }

    static async update(uuid, {receive_name, receive_phone, receive_address, receive_lat, receive_lng, receive_date, is_as_soon_as_possible, note, list_product}) {
        let deliveryDb = this.openDeliveryConnection();

        //region [validation]

        if (util.isNullOrUndefined(uuid))
            throw {code: 'uuid_missing'};

        if (!util.isNullOrUndefined(receive_phone) && !util.isPhoneNumber(receive_phone))
            throw {code: 'receive_phone_invalid'};

        if (!util.isNullOrUndefined(receive_date) && !util.isDatetime(receive_date))
            throw {code: 'receive_date_invalid'};

        if (note !== undefined && util.isNullOrEmpty(note))
            note = null;

        //endregion

        //region [get user order]

        let userOrder = await this.dao.getByUuid(uuid);
        if (util.isNullOrUndefined(userOrder))
            throw {code: 'user_order_not_found'};

        //endregion

        //region [prepare product]

        let products, money;
        if (!util.isNullOrUndefined(list_product))
            products = await prepareListProduct(list_product, userOrder.store_id);

        //endregion

        await deliveryDb.transaction(async trx => {
            //region [update user order]

            let updatedData = {};

            if (receive_name !== undefined)
                updatedData.receive_name = receive_name;
            if (receive_phone !== undefined)
                updatedData.receive_phone = receive_phone;
            if (receive_address !== undefined)
                updatedData.receive_address = receive_address;
            if (receive_lat !== undefined)
                updatedData.receive_lat = receive_lat;
            if (receive_lng !== undefined)
                updatedData.receive_lng = receive_lng;
            if (receive_date !== undefined)
                updatedData.receive_date = receive_date.toDate();
            if (is_as_soon_as_possible !== undefined)
                updatedData.is_as_soon_as_possible = is_as_soon_as_possible;
            if (note !== undefined)
                updatedData.note = note;

            if (Object.keys(updatedData).length > 0)
                await trx.table(TABLE)
                    .update(updatedData)
                    .where({
                        uuid: userOrder.uuid,
                    });

            Object.assign(userOrder, updatedData);

            //endregion

            //region [update user order line]

            if (products !== undefined) {
                await trx.table('user_order_addon')
                    .delete()
                    .whereIn(
                        'user_order_line_id',
                        trx.table('user_order_line')
                            .where({user_order_uuid: userOrder.uuid})
                            .select('id')
                    );

                await trx.table('user_order_line')
                    .delete()
                    .where({user_order_uuid: userOrder.uuid});

                for (let item of products) {
                    let lineId = await trx.table('user_order_line').insert({
                        user_order_uuid: userOrder.uuid,
                        product_id: item.product.id,
                        product_name: item.product.name,
                        quantity: item.quantity,
                        price: item.price,
                        note: item.note,
                    });
                    lineId = lineId[0];

                    for (let addonItem of item.list_addon) {
                        await trx.table('user_order_addon').insert({
                            user_order_line_id: lineId,
                            product_id: item.product.id,
                            addon_id: addonItem.addon.id,
                            category_name: addonItem.category.name,
                            addon_name: addonItem.addon.name,
                            data_type: addonItem.category.data_type,
                            value: addonItem.value,
                        });
                    }
                }
            }

            //endregion

            //region [quotation & cashback]

            await trx.table('user_order_quotation')
                .delete()
                .where({user_order_uuid: userOrder.uuid});

            let quotations = await calcQuotation(userOrder, {list_product: products});

            let money = 0;
            for (let quotation of quotations) {
                money += quotation.money;

                await trx.table('user_order_quotation').insert({
                    user_order_uuid: userOrder.uuid,
                    code: quotation.code,
                    name: quotation.name,
                    money: quotation.money,
                    data: quotation.data,
                });
            }

            let cashback = 0;
            if (store.cashback_type === storeDao.config.CASHBACK_TYPE.FIXED)
                cashback = store.cashback_price;
            else
                cashback = Math.floor(store.cashback_price * money / 100);

            await trx.table(TABLE)
                .update({
                    money: money,
                    cashback: cashback,
                })
                .where({
                    uuid: userOrder.uuid,
                });

            userOrder.money = money;
            userOrder.cashback = cashback;

            //endregion
        });

        return userOrder.uuid;
    }

    static async updateState(uuid, state, emitSocket = true) {
        let deliveryDb = this.openDeliveryConnection();

        //region [validation]

        if (util.isNullOrUndefined(uuid))
            throw {code: 'uuid_missing'};

        if (util.isNullOrUndefined(state))
            throw {code: 'state_missing'};
        if (typeof state !== 'string' || !Object.values(STATE).includes(state))
            throw {code: 'state_invalid'};

        //endregion

        //region [get user order]

        let userOrder = await this.dao.getByUuid(uuid);
        if (util.isNullOrUndefined(userOrder))
            throw {code: 'user_order_not_found'};

        //endregion

        if (userOrder.state === state)
            return userOrder.uuid;

        await deliveryDb.transaction(async trx => {
            let oldState = userOrder.state;

            //region [update state]

            let updatedData = {
                state: state,
            };
            if (state === STATE.COMPLETED)
                updatedData.complete_date = moment().toDate();

            await trx.table(TABLE)
                .update(updatedData)
                .where({
                    uuid: userOrder.uuid,
                });

            //endregion

            //region [order tracking]

            // update old tracking
            await trx.table('user_order_tracking')
                .update({
                    end_date: moment().toDate(),
                })
                .where({
                    state: oldState,
                    user_order_uuid: userOrder.uuid,
                });

            // insert new tracking
            let nextState, nextStateEndDateEstimate;

            switch (oldState) {
                case STATE.DRAFT:
                    nextState = STATE.SUBMITTED;
                    break;
                case STATE.SUBMITTED:
                    nextState = STATE.CONFIRMED;
                    break;
                case STATE.CONFIRMED:
                    nextState = STATE.ASSIGNED;
                    break;
                case STATE.ASSIGNED:
                    nextState = STATE.PICKED;
                    break;
                case STATE.PICKED:
                    nextState = STATE.COMPLETED;
                    break;
            }
            nextStateEndDateEstimate = await calcStateEndDateEstimate(userOrder, nextState);

            if (nextState)
                await trx.table('user_order_tracking').insert({
                    state: nextState,
                    user_order_uuid: userOrder.uuid,
                    start_date: moment().toDate(),
                    end_date_estimate: nextStateEndDateEstimate ? nextStateEndDateEstimate.toDate() : null,
                });

            //endregion
        });

        //region [emit socket]

        if (emitSocket) {
            await socket.emit({
                event: 'user_order/state_changed',
                data: {
                    user_order_uuid: userOrder.uuid,
                    old_state: userOrder.state,
                    new_state: state,
                },
                to: ['admin']
            });
        }

        //endregion

        return userOrder.uuid;
    }
};

database.register(module.exports);