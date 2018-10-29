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

async function adminUpdateUserOrder() {
    const options = {
        url: server.host + '/api/user/payment/gateway',
        method: 'put',
        header: undefined,
        auth: undefined,
        json: true,
        body: {

        },
      };  
      const res = await rest(options, true);
      assert(res.body.data.length >= 1, 'empty or undifined array response');
      return res;
}
//endregion

//region [test structure]
describe('#test payment api', function() {
    describe('#start server', function() {
        it('should start server in 5s', async () => {
            await timeout(5000);
            return require('../app').app;
        }).timeout(TIME_OUT);
    });
    describe('#call api get list payment_gateway', function() {
        it('api should response array not empty', async () => {
            return await getGateway();
        }).timeout(TIME_OUT);
    });
});
//endregion