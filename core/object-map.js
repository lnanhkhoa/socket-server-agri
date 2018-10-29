const util = require('./util');

module.exports = class {
    static init({target, map}) {
        if (typeof map !== 'object')
            throw `arg 'map' is invalid`;

        let result = target;
        if (util.isNullOrUndefined(result))
            result = {};

        for (let key in map) {
            if (result.hasOwnProperty(key) || !map[key].hasOwnProperty('default'))
                continue;

            if (util.isNullOrUndefined(map[key].default))
                result[key] = null;
            else
                result[key] = map[key].default;
        }
        return result;
    }

    static check({target, map, data}) {
        if (typeof target !== 'object')
            throw `arg 'target' is not a object`;
        if (typeof map !== 'object')
            throw `arg 'map' is invalid`;

        let result = {};
        for (let key in map) {
            let field = map[key];

            if (field.required === true && !target.hasOwnProperty(key))
                throw `field '${key}' is required`;

            let fieldValue = target[key];
            if (util.isNullOrUndefined(fieldValue))
                fieldValue = null;

            if (field.allow_null === false && util.isNullOrUndefined(fieldValue))
                throw `field '${key}' is not allow to be null`;

            if (field.hasOwnProperty('parse') && typeof field.parse === 'function')
                try {
                    fieldValue = field.parse(fieldValue, target, data);
                } catch (error) {
                    throw `field '${key}' value is invalid: ${error}`;
                }

            result[key] = fieldValue;
        }
        return result;
    }

    static initAndCheck({target, map, data}) {
        return this.check({target: this.init({target, map}), map, data});
    }
};