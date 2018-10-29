const objectMap = require('../object-map');
const util = require('../util');
const RawType = require('./raw');

module.exports = class ListType extends RawType {
    static get configuration() {
        return Object.assign({
            item_type: {
                required: true,
                allow_null: false,
                parse: (value, config) => {
                    if (!(value instanceof RawType))
                        throw `must be delivery type of RawType`;

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

    static init(item_type, data) {
        if (typeof data !== 'object')
            data = {};
        data = Object.assign(data, {item_type});

        return new this(data);
    };

    static canBeParameter(endPoint) {
        return !['GET', 'DELETE'].includes(endPoint.method);
    };

    static _check(value, config, mode) {
        if (!Array.isArray(value))
            throw `must be Array type`;

        if (!util.isNullOrUndefined(config.min) && value.length < config.min)
            throw `number of items must be >= ${config.min}`;
        if (!util.isNullOrUndefined(config.max) && value.length > config.max)
            throw `number of items must be <= ${config.max}`;

        let itemConfig = config.item_type._data;
        let itemType = require('../types')[config.item_type.constructor.name];

        try {
            for (let itemValue of value)
                itemType.check(itemValue, itemConfig, mode);
        } catch (e) {
            throw `some item is invalid: ${JSON.stringify(e).replace(/"/g, '\'')}`;
        }
    };

    static _parse(value, config, mode) {
        let itemConfig = config.item_type._data;
        let itemType = require('../types')[config.item_type.constructor.name];

        let result = [];
        for (let itemValue of value)
            result.push(itemType.parse(itemValue, itemConfig, mode))
        return result;
    };

    static _swaggerInfo(config, mode) {
        let itemConfig = config.item_type._data;
        let itemType = require('../types')[config.item_type.constructor.name];

        return {
            'type': 'array',
            'items': itemType.swaggerInfo(itemConfig, 'parameter'),
        };
    };
};