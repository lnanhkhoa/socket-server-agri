const objectMap = require('../object-map');
const util = require('../util');

module.exports = class RawType {
    static get configuration() {
        return {
            allowEmpty: {
                default: true,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw 'must be Boolean type';

                    return value;
                },
            },

            enum: {
                parse: (value) => {
                    if (util.isNullOrEmpty(value))
                        return null;

                    if (!Array.isArray(value))
                        throw `must be Array type`;

                    return value;
                },
            },

            description: {
                parse: (value) => {
                    if (util.isNullOrUndefined(value))
                        return null;

                    if (typeof value !== 'string')
                        throw `must be String type`;

                    return value.trim();
                },
            },
        }
    };

    // ----------------------------------------------------------------------

    constructor(data) {
        let type = require('../types')[this.constructor.name];
        this._data = objectMap.initAndCheck({target: data, map: type.configuration});
    };

    static init(data) {
        return new this(data);
    };

    static canBeParameter(endPoint) {
        return true;
    };

    static canBeResponse(endPoint) {
        return true;
    };

    static swaggerInfo(config, mode) {
        let result = this._swaggerInfo(config, mode);

        if (!util.isNullOrUndefined(config.default)) {
            result.default = config.default;
            result.example = config.default;
        }

        if (!util.isNullOrEmpty(config.enum))
            result.enum = config.enum;

        if (!util.isNullOrUndefined(config.description))
            result.description = config.description;

        if (config.allowEmpty === false)
            result.allowEmptyValue = config.allowEmpty;

        return result;
    };

    static check(value, options, mode) {
        let config = objectMap.check({target: options, map: this.configuration});

        if (util.isNullOrUndefined(value))
            return;

        if (config.allowEmpty === false && util.isNullOrEmpty(value))
            throw `cannot be empty`;

        if (!util.isNullOrUndefined(config.enum) && !config.enum.includes(value))
            throw `must be ${config.enum.map(x => `'${x}'`).join(', ')}`;

        this._check(value, config || {}, mode);
    };

    static parse(value, options, mode) {
        this.check(value, options, mode);
        if (util.isNullOrUndefined(value))
            return null;

        return this._parse(value, options || {}, mode);
    };

    static _swaggerInfo(config, mode) {
        return {
            type: 'object',
            properties: {},
        }
    };

    static _check(value, config, mode) {
    };

    static _parse(value, config, mode) {
        return value;
    };
};