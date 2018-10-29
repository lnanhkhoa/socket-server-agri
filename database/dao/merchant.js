const database = require('../index');

const STATE = Object.freeze({
    ACTIVE: 'active', // hoạt động
    INACTIVE: 'locked', // đã khóa
});

module.exports = class {
    static get config() {
        return {
            STATE,
        }
    }

    static async getById(id) {
        let voucherDb = this.openVoucherConnection();

        return await voucherDb.table('res_company').where({id: id}).first();
    }
};

database.register(module.exports);