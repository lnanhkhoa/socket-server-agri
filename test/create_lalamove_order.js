const util = require('../core/util');
const moment = require('moment');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
// const assert = require('assert');
// const request = require("request");
// const curlify = require('request-as-curl');

async function createLalamoveOrder() {
    let body = {
        scheduleAt: moment().add(10, 'minutes').toISOString(),
        serviceType: 'MOTORCYCLE',
        specialRequests: [
            'LALABAG',
            'HELP_BUY',
        ],
        requesterContact: {
            name: 'Quang Lực',
            phone: '+840908624162',
        },
        stops: [
            {
                addresses: {
                    en_VN: {
                        displayString: '1051 Hậu Giang, 11, Ho Chi Minh City',
                        country: 'VN',
                    },
                },
                location: {
                    lat: '10.762744',
                    lng: '106.7005112',
                },
            },
            {
                addresses: {
                    en_VN: {
                        displayString: '192 Hoàng Diệu, District 4, Ho Chi Minh City',
                        country: 'VN',
                    },
                },
                location: {
                    lat: '10.762744',
                    lng: '106.7005112',
                },
            },
        ],
        deliveries: [
            {
                toStop: 1,
                toContact: {
                    name: 'Quang Lực',
                    phone: '+840908624162',
                },
            },
        ],
    };
    let quotation = await util.lalamove('quotation', body);

    Object.assign(body, {
        callerSideCustomerOrderId: util.randomString({length: 10}),
        quotedTotalFee: {
            amount: quotation.totalFee,
            currency: quotation.totalFeeCurrency,
        },
    });
    let order = {};
    try {
        order = await util.lalamove('postOrder', body);
    } catch(e) {
        throw new Error(e, 'lalamove library crash');
    }

    // console.log(order.customerOrderId);
    assert(![undefined, null].includes(order.customerOrderId), 'empty customerOrderId');
}

// createLalamoveOrder()
describe('#create_lalamove_order_via_api', function() {
    it('should not error', async () => {
      return await createLalamoveOrder()
    }).timeout(10000);
  });