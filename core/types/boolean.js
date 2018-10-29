const util = require('../util');
const RawType = require('./raw');

module.exports = class BooleanType extends RawType {
    static _check(value, config, mode) {
        let data = this._parse(value, config, mode);
        if (util.isNullOrUndefined(value))
            throw `cannot convert to boolean`;
    };

    static _parse(value, config, mode) {
        let result = undefined;

        if (value === true || value === false)
            result = value;
        else if (value === 1)
            result = true;
        else if (value === 0)
            result = false;
        else if (typeof value === 'string') {
            let str = value.trim().toLowerCase();
            if (str === 'true' || str === '1')
                result = true;
            else if (str === 'false' || str === '0')
                result = false;
        }

        return result;
    };

    static _swaggerInfo(config, mode) {
        return {type: 'boolean'};
    };
};