const util = require('../util');
const RawType = require('./raw');

class StringType extends RawType {
    static get configuration() {
        return Object.assign({
            trim: {
                default: true,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw 'must be Boolean type';

                    return value;
                },
            },

            min: {
                parse: (value, config) => {
                    if (util.isNullOrUndefined(value))
                        return null;

                    if (typeof value !== 'number')
                        throw `must be Number type`;
                    if (config.max && value > config.max)
                        throw `must be less than field 'max'`;

                    return value;
                },
            },

            max: {
                parse: (value, config) => {
                    if (util.isNullOrUndefined(value))
                        return null;

                    if (typeof value !== 'number')
                        throw `must be Number type`;
                    if (config.min && value < config.min)
                        throw `must be greater than field 'min'`;

                    return value;
                },
            },
        }, super.configuration);
    };

    // ----------------------------------------------------------------------

    static _check(value, config, mode) {
        if (typeof value === 'object')
            throw `cannot convert to string`;

        let data = this._parse(value, config, mode);

        if (!util.isNullOrUndefined(config.min) && data.length < config.min)
            throw `must have more than or equal to ${config.min} characters`;
        if (!util.isNullOrUndefined(config.max) && data.length > config.max)
            throw `must have less than or equal to ${config.max} characters`;
    };

    static _parse(value, config, mode) {
        let result = String(value);
        if (config.trim)
            result = result.trim();

        return result;
    };

    static _swaggerInfo(config, mode) {
        let result = {type: 'string'};

        if (!util.isNullOrUndefined(config.min))
            result.minLength = config.min;
        if (!util.isNullOrUndefined(config.max))
            result.maxLength = config.max;

        return result;
    };
}

module.exports = StringType;