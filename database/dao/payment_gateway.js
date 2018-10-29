const database = require('../index');

const TABLE = 'payment_gateway';
const STATE = Object.freeze({
    ACTIVE: 'active', // hoạt động
    INACTIVE: 'inactive', // đã khóa
});

module.exports = class {
    static get config() {
        return {
            STATE,
        }
    }

    static async getByCode(code) {
        const deliveryDb = this.openDeliveryConnection();

        return await deliveryDb.table(TABLE).where({code: code}).first();
    }

    static async getListActive() {
        const deliveryDb = this.openDeliveryConnection();
        
        return await deliveryDb.table(TABLE).where({state: STATE.ACTIVE});
    }
};

database.register(module.exports);