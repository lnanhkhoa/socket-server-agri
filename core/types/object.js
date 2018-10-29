const objectMap = require('../object-map');
const util = require('../util');
const RawType = require('./raw');

module.exports = class ObjectType extends RawType {
    static get configuration() {
        return Object.assign({
            field: {
                required: true,
                allow_null: false,
                parse: (value, config) => {
                    if (typeof value !== 'object')
                        throw 'must be Object type';

                    const api = require('../../api');

                    let result = {};
                    for (let key in value) {
                        try {
                            let field = value[key];

                            if (field instanceof RawType)
                                field = {type: field};
                            field = objectMap.initAndCheck({target: field, map: api.field_configuration});

                            result[key] = field;
                        } catch (e) {
                            throw `field '${key}' is invalid: ${e}`;
                        }
                    }
                    return result;
                },
            },
        }, super.configuration);
    };

    // ----------------------------------------------------------------------

    static init(field, data) {
        if (typeof data !== 'object')
            data = {};
        data = Object.assign(data, {field});

        return new this(data);
    };

    static canBeParameter(endPoint) {
        return !['GET', 'DELETE'].includes(endPoint.method);
    };

    static swaggerInfo(config, mode) {
        let result = super.swaggerInfo(config, mode);

        if (util.isNullOrUndefined(result.example))
            delete result.example;

        return result;
    };

    static _check(value, config, mode) {
        if (typeof value !== 'object')
            throw `cannot convert to object`;

        const api = require('../../api');
        let error = {};
        for (let key in config.field) {
            let field = config.field[key];

            let fieldValue;
            if (value.hasOwnProperty(key))
                fieldValue = value[key];
            else if (field.required === true)
                throw `${key} is required`;
            else
                fieldValue = field.default;

            if (util.isNullOrUndefined(fieldValue) && field.allow_null === false)
                throw `${key} cannot be null`;

            let fieldConfig = field.type._data;
            let fieldType = require('../types')[field.type.constructor.name];

            try {
                fieldType.check(fieldValue, fieldConfig, mode);
            } catch (e) {
                error[key] = e;
            }
        }

        if (Object.keys(error).length > 0)
            throw error;
    };

    static _parse(value, config, mode) {
        let result = {};

        for (let key in config.field) {
            let field = config.field[key];

            let fieldValue;
            if (value.hasOwnProperty(key))
                fieldValue = value[key];
            else
                fieldValue = field.default;

            let fieldConfig = field.type._data;
            let fieldType = require('../types')[field.type.constructor.name];

            fieldValue = fieldType.parse(fieldValue, fieldConfig, mode);
            if (!util.isNullOrUndefined(field.parse))
                fieldValue = field.parse(fieldValue, fieldConfig);

            result[key] = fieldValue;
        }

        return result;
    };

    static _swaggerInfo(config, mode) {
        let result = {
            'type': 'object',
            'properties': {},
        };

        let required = [];
        for (let key in config.field) {
            let field = config.field[key];
            let fieldConfig = field.type._data;
            let fieldType = require('../types')[field.type.constructor.name];

            if (field.required === true)
                required.push(key);


            if (!util.isNullOrUndefined(field.enum))
                fieldConfig.enum = field.enum;

            result.properties[key] = fieldType.swaggerInfo(fieldConfig, mode);
        }

        if (required.length > 0)
            result.required = required;

        return result;
    };
};