const util = require('../util');
const RawType = require('./raw');

module.exports = class NumberType extends RawType {
    static get configuration() {
        return Object.assign({
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
        if (Number.isNaN(Number(value)) || Number(value) === Infinity)
            throw `cannot convert to number`;

        let data = this._parse(value, config, mode);

        if (!util.isNullOrUndefined(config.min) && data < config.min)
            throw `must be >= ${config.min}`;
        if (!util.isNullOrUndefined(config.max) && data > config.max)
            throw `must be <= ${config.max}`;
    };

    static _parse(value, config, mode) {
        return Number(value);
    };

    static _swaggerInfo(config, mode) {
        let result = {type: 'number'};

        if (!util.isNullOrUndefined(config.min))
            result.minimum = config.min;
        if (!util.isNullOrUndefined(config.max))
            result.maximum = config.max;

        return result;
    };
};