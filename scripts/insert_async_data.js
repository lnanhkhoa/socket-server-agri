


const config = require('../config');
const APIKey = 'Kjhu4$%123@fkasuio$1Ij%hT456'
const baseURI = 'http://49f223db.ngrok.io/api'
const fetch = require('node-fetch');
const queryString = require('query-string')
const randomString = require('randomstring')
const models = require('../database/').models
const util = require('../core/util')



const validateCustomerUUID = function (text) {
    if (!text) return false
    return text.length === 18 ? true : false
}

const validateEmail = function (email) {
    if (text === '') return false
    return true
}

const validatePhoneNumber = function (phone_number) {
    // validate and transform phone number
    const phone_number_edit = util.transformPhoneNumber(phone_number)
    const validatePhoneNumber = util.validatePhoneNumber(phone_number_edit)
    if (!validatePhoneNumber) return false
    return true
    //   exist --> update info customer
    //   const customer = await models.customer.getByPhoneNumber(phone_number_edit);

}

exports.customer_insert = function (customer) {

}

exports.customer_update = function (customer) {
    let response = {}
    try {
        let res = await fetch(`${baseURI}/Customer/Update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'APIKey': APIKey
            },
            // body: JSON.stringify({
            //     ...
            //     phone_number: `0${numberRand()}`
            // })
        })
        let responseJson = await res.text();
        response = await JSON.parse(responseJson)
    } catch (e) {
        throw { code: 'response_body_not_found' };
    }
}