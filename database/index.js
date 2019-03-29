const Base = require('./base');
const flow = require('./flow');
const dao = {};

module.exports = {
    base: require('./base'),
    dao: dao,

    register: function (dao) {
        for (let methodName of Object.getOwnPropertyNames(dao)) {
            if (['length', 'prototype'].includes(methodName) || typeof dao[methodName] !== 'function')
                continue;

            dao['_' + methodName] = dao[methodName];
            dao[methodName] = async function (...args) {
                return await flow.process.bind(this)(dao['_' + methodName], ...args)
            };
        }
    }
};

// dao.config = require('./dao/config');
// dao.article = require('./dao/article');
// dao.merchant = require('./dao/merchant');
// dao.store = require('./dao/store');
// dao.store_image = require('./dao/store_image');
// dao.store_tag = require('./dao/store_tag');
// dao.store_tag_category = require('./dao/store_tag_category');
// dao.product = require('./dao/product');
// dao.product_category = require('./dao/product_category');
// dao.product_addon = require('./dao/product_addon');
// dao.product_addon_category = require('./dao/product_addon_category');
// dao.promotion = require('./dao/promotion');
// dao.user = require('./dao/user');
// dao.user_order = require('./dao/user_order');
// dao.merchant_order = require('./dao/merchant_order');
// dao.shipment_order = require('./dao/shipment_order');
// dao.payment_order = require('./dao/payment_order');
// dao.payment_gateway = require('./dao/payment_gateway');