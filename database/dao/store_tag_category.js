const database = require('../index');

const TABLE = 'store_tag_category';
const CODE = Object.freeze({
    CATEGORY: 'category', // phân loại nhà hàng
});
const STATE = Object.freeze({
    ACTIVE: 'active', // hoạt động
    INACTIVE: 'inactive', // đã khóa
});

module.exports = class {
    static get config() {
        return {
            CODE,
            STATE,
        }
    }

    static async getByCode(code) {
        let deliveryDb = this.openDeliveryConnection();

        return await deliveryDb.table(TABLE).where({code: code}).first();
    }
};

database.register(module.exports);