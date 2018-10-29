const uuidv4 = require('uuid/v4');
const moment = require('moment');

module.exports = {
    isNullOrUndefined: function (value) {
        return value === null || value === undefined;
    },

    isNullOrEmpty: function (value) {
        if (value === null || value === undefined)
            return true;

        if (typeof value === 'string')
            return value.trim().length === 0;
        else if (Array.isArray(value))
            return value.length === 0;

        return false;
    },

    isPhoneNumber: function (value) {
        if (value === null || value === undefined || typeof value !== 'string')
            return false;
        if (value.length === 0 || value.length > 15)
            return false;
        return /^[0-9]+$/.test(value);
    },

    addPhoneCountryCode: function ({phone, country_code = '+84', remove_first_digit = true}) {
        if (!this.isPhoneNumber(phone))
            throw 'must be phone number';

        return country_code + (remove_first_digit ? phone.substring(1) : phone);
    },

    isDatetime: function (value) {
        if (value === null || value === undefined || !(value instanceof moment))
            return false;
        return value.isValid();
    },

    randomString: function ({uuid = false, length, allow_characters = '0123456789', prefix = '', postfix = ''}) {
        let result;

        if (uuid)
            result = uuidv4().replace(/-/g, '');
        else {
            result = '';
            for (let i = 0; i < length; i++)
                result += allow_characters[Math.floor(Math.random() * allow_characters.length)];
        }

        return prefix + result + postfix;
    },

    getShippingLimitDuration: async function (shipping_limit_time) {
        const dao = require('../database').dao;

        return shipping_limit_time ? shipping_limit_time.diff(moment(), 'minutes') : await dao.config.getValueByKey('default_shipping_limit_duration');
    },

    calcDistanceFromLatLngInKm: function (lat1, lng1, lat2, lng2) {
        let R = 6371; // Radius of the earth in km

        let dLat = (lat2 - lat1) * (Math.PI / 180);
        let dLng = (lng2 - lng1) * (Math.PI / 180);
        let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    mapAwait: async function (listItem, mapMethod) {
        let result = [];

        for (let item of listItem)
            result.push(await mapMethod(item));

        return result;
    },

    getTypeClassByName: function (name) {
        return require('../core/types')[name[0].toUpperCase() + name.substring(1) + 'Type'];
    },
};