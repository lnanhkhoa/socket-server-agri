const util = require('../util');
const dao = require('../../database').dao;
const moment = require('moment');

const PROVIDER = 'lalamove';

module.exports = class lalamove {
    static get config() {
        return {PROVIDER};
    }

    /**
     * request lalamove api
     * @param {string} api api's name of lalamove
     * @param {object} body data
     * @returns {object} response from lalamove
     */
    static async request(api, body) {
        try {
            return (await require('lalamove-js')(require('../../config').lalamove)[api](body)).body;
        } catch (e) {
            throw e.response.body;
        }
    }

    /** call api create new lalamove shipment order
     *
     * @param {string} user_order_uuid uuid of user_order
     * @returns {object} api response
     */
    static async createNewOrder({user_order_uuid}) {
        /* demo data
            lat: '10.762744',
            lng: '106.7005112',
        */
        let userOrder = await dao.user_order.getByUuid(user_order_uuid);
        let store = await dao.store.getById(userOrder.store_id);
        let userPhone = util.addPhoneCountryCode({phone: userOrder.receive_phone, remove_first_digit: false});

        //region [prepare remark]

        let remark = `${store.name} (${userOrder.money} VNĐ) ${userOrder.uuid} Ứng trước và nhận tiền mặt tại điểm trả hàng`;
        remark += '\n-----------------------------------------------------------------------------------------------------------------------\n';

        let products = await dao.user_order.getListProduct(userOrder.uuid);
        for (let product of products) {
            remark += `${product.quantity} ${product.name}`;

            let addonNote = [];
            for (let addon of product.list_addon) {
                if (addon.data_type === 'boolean' && addon.value === true)
                    addonNote.push(addon.addon_name);
                else if (addon.data_type === 'number' && addon.value > 0)
                    addonNote.push(`${addon.value} ${addon.addon_name}`);
            }
            addonNote = addonNote.join(', ');

            if (addonNote !== '')
                remark += ` [ ${addonNote} ]`;

            if (!util.isNullOrEmpty(product.note))
                remark += `\n     ${product.note}`;

            remark += '\n';
        }

        remark += '-----------------------------------------------------------------------------------------------------------------------\n';
        remark += 'Liên hệ người nhận để xác nhận đơn hàng, không cần gọi cho cửa hàng.';

        //endregion

        let body = {
            scheduleAt: moment(userOrder.receive_date).toISOString(),
            serviceType: 'MOTORCYCLE',
            specialRequests: [
                'LALABAG',
                'HELP_BUY',
            ],
            requesterContact: {
                name: userOrder.receive_name,
                phone: userPhone,
            },
            stops: [
                {
                    addresses: {
                        en_VN: {
                            displayString: store.address,
                            country: 'VN',
                        },
                    },
                    location: {
                        lat: store.lat.toString(),
                        lng: store.lng.toString(),
                    },
                },
                {
                    addresses: {
                        en_VN: {
                            displayString: userOrder.receive_address,
                            country: 'VN',
                        },
                    },
                    location: {
                        lat: userOrder.receive_lat.toString(),
                        lng: userOrder.receive_lng.toString(),
                    },
                },
            ],
            deliveries: [
                {
                    toStop: 1,
                    toContact: {
                        name: userOrder.receive_name,
                        phone: userPhone,
                    },
                    remarks: remark,
                },
            ],
        };
        let quotation = await this.request('quotation', body);

        Object.assign(body, {
            callerSideCustomerOrderId: userOrder.uuid,
            quotedTotalFee: {
                amount: quotation.totalFee,
                currency: quotation.totalFeeCurrency,
            },
        });

        try {
            return await this.request('postOrder', body);
        } catch (e) {
            throw e;
        }
    }

    /** cancel lalamove order
     * 
     * @param {string} customerOrderId id lalamove order
     * @returns {string} id of lalamove order
     */
    static async cancelOrder(customerOrderId) {
        return await this.request('cancelOrder', customerOrderId);
    }

    /** call lalamove api with customerOrderId to get detail
     *
     */
    static async getDetailOrder() {

    }
};