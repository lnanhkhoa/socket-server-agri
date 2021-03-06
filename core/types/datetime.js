const util = require('../util');
const RawType = require('./raw');
const moment = require('moment');

module.exports = class DatetimeType extends RawType {
    static _check(value, config, mode) {
        if (mode === 'parameter') {
            if (Number.isNaN(Number(value)) || Number(value) === Infinity || !Number.isInteger(Number(value)))
                throw 'cannot convert to datetime';
        } else if (mode === 'response') {
            if (!(typeof value === 'string'))
                throw 'must be string type';
            if (!moment(value).isValid())
                throw 'datetime is invalid';
        }
    };

    static _parse(value, config, mode) {
        if (mode === 'parameter')
            return moment(parseInt(value)).format("YYYY-MM-DD HH:mm:ss.SSS");
        else if (mode === 'response')
            return parseInt(moment(value).format("x"));
        else
            return null;
    };

    static _swaggerInfo(config, mode) {
        return { type: 'number' };
    };
};