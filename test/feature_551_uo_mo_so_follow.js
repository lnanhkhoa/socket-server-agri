const util = require('../core/util');
const moment = require('moment');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();
const { rest, convert, log, timeout } = require('./core');

let _server; 

const server = {
    host: 'http://localhost:8080',
}
const TIME_OUT = 10000;
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozODUyNSwibGV2ZWwiOiJlbmR1c2VyIiwiZXhwIjoxNTU4NTIxNjk4LCJpYXQiOjE1MjY5ODU2OTgsIm1lcmNoYW50X2lkIjoxLCJuYmYiOjE1MjY5ODU2OTgsImlkZW50aXR5IjozODUyNX0.wZKtUCZfX2qLBlLPK_e-HvRifUatVfJNirWVZBWljVQ'
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImxvZ2luIjoibHVjLnRhIiwiaWF0IjoxNTI2OTk4OTgxfQ.Is3n4hOaugTYwpprbCysI8kWAJ2flgngYHBQdcx99OU';

const cache = {};
//region [test function]
function template() {
    const options = {
        url: server.host + '/api/users/register',
        method: 'post',
        header: undefined,
        auth: undefined,
        json: true,
        body: {      
        //   password: _password,
        //   email: email,
        }
      };  
      return rest(options, (error, res, body) => { return resolve() }, false);
}

async function createDrafUO() {
    const options = {
        url: server.host + '/api/user/user_order',
        method: 'post',
        headers: {
            shipping_receive_address: 'dahuy test user address',
            shipping_receive_lat: 10.762744,
            shipping_receive_lng: 106.7005112,
            user_authorization: token,
        },
        auth: undefined,
        json: true,
        body: {      
            store_id: 529, //1051 Hậu Giang, 11, Ho Chi Minh City
            receive_name : 'dahuy test user',
            receive_phone : '01214595277',
            note: "american",
            list_product: [
                {
                    product_id: 1, // ga2 luoc
                    quantity: 1,
                    note: 'testing note create draf UO',
                    list_addon: [
                        {
                            addon_id: 2,
                            value: true,
                        },
                        {
                            addon_id: 13,
                            value: true,
                        },
                        {
                            addon_id: 19,
                            value: 5,
                        }
                    ]
                }
            ],
        }
    };  
    const res = await rest(options, true);
    res.body.data.should.be.not.empty;
    cache.uo_uuid = res.body.data;
    return res;
}

async function updateSubmittedUO() {
    const options = {
        url: server.host + '/api/user/user_order/submit',
        method: 'put',
        headers: {
            user_authorization: token,
        },
        auth: undefined,
        json: true,
        body: {      
            user_order_uuid: cache.uo_uuid,
            gateway_code: 'lalamove_cod',
            gateway_data: {}
        }
    };  
    log(`option! ${cache.uo_uuid}`);
    log(JSON.stringify(options));
    const res = await rest(options, true);
    
    res.body.data.should.be.not.empty;
    return res;
}

async function createNewMO() {
    const options = {
        url: server.host + '/api/admin/merchant_order',
        method: 'post',
        headers: {
            admin_authorization: adminToken,
        },
        auth: undefined,
        json: true,
        body: {      
            user_order_uuid: cache.uo_uuid,
        }
    };  
    const res = await rest(options, true);
    res.body.data.should.be.not.empty;
    cache.mo_uuid = res.body.data;
    return res;
}

async function updateConfirmedUO() {
    const options = {
        url: server.host + '/api/admin/user_order/confirm',
        method: 'post',
        headers: {
            admin_authorization: adminToken,
        },
        auth: undefined,
        json: true,
        body: {      
            user_order_uuid: cache.uo_uuid,
        }
    };  
    const res = await rest(options, true);
    res.body.data.should.be.not.empty;
    cache.mo_uuid = res.body.data;
    return res;
}

async function createNewShipmentOrder() {
    const options = {
        url: server.host + '/api/admin/shipment_order/lalamove',
        method: 'post',
        headers: {
            admin_authorization: adminToken,
        },
        auth: undefined,
        json: true,
        body: {      
            user_order_uuid: cache.uo_uuid,
        }
    };  
    const res = await rest(options, true);
    res.body.data.should.be.not.empty;
    res.body.data.should.be.not.empty;
    cache.mo_uuid = res.body.data;
    return res;
}

async function adminUpdateUO() {
    const options = {
        url: server.host + '/api/admin/user_order',
        method: 'put',
        headers: {
            admin_authorization: adminToken,
        },
        auth: undefined,
        json: true,
        body: {      
            receive_name: 'receive name test dahuy',
            receive_phone: '01214595555',
            user_order_uuid: cache.uo_uuid,
            receive_lat: 10.762746,
            list_product: [
                {
                    product_id: 1, // ga2 luoc
                    quantity: 1,
                    note: 'update UO by admin',
                    list_addon: [
                        {
                            addon_id: 2,
                            value: true,
                        },
                        {
                            addon_id: 13,
                            value: true,
                        },
                        {
                            addon_id: 19,
                            value: 1,
                        }
                    ]
                }
            ],
        }
    };  
    const res = await rest(options, true);
    res.body.data.should.be.not.empty;
    res.body.data.should.be.not.empty;
    cache.mo_uuid = res.body.data;
    return res;
}
//endregion


  

//region [test structure]
describe('#test follow update database uo mo so and socket emit', function() {
    describe('#start server', function() {
        it('should start server in 5s', async () => {
            await timeout(5000);
            return require('../app').app;
        }).timeout(TIME_OUT);
    });
    describe('#create draf uo', function() {
        it('api should response UO uuid', async () => {
            return await createDrafUO();
        }).timeout(TIME_OUT);
    });
    describe('#update submitted UO', function() {
        it('should not error', async () => {
            return await updateSubmittedUO();
        }).timeout(TIME_OUT);
        // it('should emit socket new change uo', async () => {
        //     throw Error('not implement yet');
        // }).timeout(TIME_OUT);
    });
    describe('#create new MO', function() {
        it('should return mo uuid in api response', async () => {
            // return await createNewMO();
        }).timeout(TIME_OUT);
        // it('should UO update status to assigned', async () => {
        //     throw Error('not implement yet');
        // }).timeout(TIME_OUT);
        // it('should emit socket new change uo', async () => {
        //     throw Error('not implement yet');
        // }).timeout(TIME_OUT);
    });
    describe('#update confirmed UO', function() {
        it('should return uo uuid in api response', async () => {
            return await updateConfirmedUO();
        }).timeout(TIME_OUT);
        // it('should auto update confirmed uo', async () => {
        //     throw Error('not implement yet');
        // }).timeout(TIME_OUT);
        // it('should emit socket new change uo', async () => {
        //     throw Error('not implement yet');
        // }).timeout(TIME_OUT);
    });
    describe('#create new SO', function() {
        it('should return shipment_order provider order uuid in api response', async () => {
            return await createNewShipmentOrder();
        }).timeout(TIME_OUT * 10000);
    });
    describe('#admin update UO', function() {
        it('should return user_order uuid', async () => {
            return await adminUpdateUO();
        }).timeout(TIME_OUT);
        // it('should emit socket new change uo', async () => {
        //     throw Error('not implement yet');
        // }).timeout(TIME_OUT);
    });
});
//endregion