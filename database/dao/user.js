const database = require('../index');

module.exports = class {
    static async getById(id) {
        let voucherDb = this.openVoucherConnection();

        return await voucherDb.table('res_users')
            .join('res_partner', 'res_partner.id', 'res_users.partner_id')
            .select('res_users.*', 'res_partner.name')
            .where({'res_users.id': id}).first();
    }
};

database.register(module.exports);