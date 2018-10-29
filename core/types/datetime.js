const util = require('../util');
const RawType = require('./raw');
const moment = require('moment');

module.exports = class DatetimeType extends RawType {
    static _check(value, config, mode) {
        if (mode === 'parameter') {
            if (Number.isNaN(Number(value)) || Number(value) === Infinity || !Number.isInteger(Number(value)))
                throw 'cannot convert to datetime';
        } else if (mode === 'response') {
            if (!(value instanceof moment))
                throw 'must be moment type';
            if (!value.isValid())
                throw 'datetime is invalid';
        }
    };

    static _parse(value, config, mode) {
        if (mode === 'parameter')
            return moment(parseInt(value));
        else if (mode === 'response')
            return value.valueOf();
        else
            return null;
    };

    static _swaggerInfo(config, mode) {
        return {type: 'number'};
    };
};