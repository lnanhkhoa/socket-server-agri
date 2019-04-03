const config = require('../config');
const objectMap = require('../core/object-map');
const swagger = require('../core/swagger');
const types = require('../core/types');
const util = require('../core/util');
const flow = require('./flow');
const moment = require('moment');
const end_point = [];

module.exports = class {
    static get configuration() {
        return {
            enable: {
                default: true,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw 'must be Boolean type';

                    return value;
                },
            },

            dev_only: {
                default: false,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw 'must be Boolean type';

                    return value;
                },
            },

            url: {
                required: true,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'string')
                        throw 'must be String type';

                    value = value.trim();

                    if (value.length === 0)
                        throw 'cannot be empty';

                    if (value[0] !== '/')
                        throw `must begin with '/'`;

                    if (/[A-Z]/.test(value))
                        throw 'must be lower case';

                    return value;
                },
            },

            redmine: {
                parse: (value) => {
                    if (util.isNullOrUndefined(value))
                        return value;

                    if (typeof value !== 'number')
                        throw 'must be number type';

                    return value;
                },
            },

            method: {
                required: true,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'string')
                        throw 'must be String type';

                    value = value.trim().toLowerCase();

                    if (!['get', 'post', 'put', 'delete'].includes(value))
                        throw `must be 'get', 'post', 'put', 'delete'`;

                    return value;
                },
            },

            swagger: {
                default: true,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw `must be Boolean type`;

                    return value;
                },
            },

            summary: {
                parse: (value) => {
                    if (util.isNullOrUndefined(value))
                        return null;

                    if (typeof value !== 'string')
                        throw `must be String type`;

                    return value.trim();
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

            tags: {
                parse: (value) => {
                    if (util.isNullOrUndefined(value))
                        return null;

                    if (!Array.isArray(value))
                        throw `must be Array type`;

                    if (value.some(item => typeof item !== 'string'))
                        throw `item must be string type`;

                    return value.map(x => x.trim());
                },
            },

            require_secret_key: {
                default: false,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw `must be Boolean type`;

                    return value;
                },
            },

            require_admin_auth: {
                default: false,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw `must be Boolean type`;

                    return value;
                },
            },

            require_merchant_auth: {
                default: false,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw `must be Boolean type`;

                    return value;
                },
            },

            merchant_permission_group: {
                parse: (value, endPoint) => {
                    if (util.isNullOrUndefined(value))
                        return null;

                    if (!Array.isArray(value))
                        throw `must be Array type`;

                    if (value.length === 0)
                        throw `cannot be empty`;

                    if (value.some(item => typeof item !== 'string'))
                        throw `item must be string type`;

                    if (endPoint.require_user_auth !== true)
                        throw `require_merchant_auth must be true to use merchant_permission_group`;

                    return value.map(x => x.trim());
                },
            },

            require_user_auth: {
                default: false,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw `must be Boolean type`;

                    return value;
                },
            },

            paging: {
                default: false,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw `must be Boolean type`;

                    return value;
                },
            },

            shipping_receive_info: {
                default: false,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw `must be Boolean type`;

                    return value;
                },
            },

            parameter: {
                default: {},
                allow_null: false,
                parse: (value, end_point) => {
                    if (typeof value !== 'object')
                        throw 'must be object type';

                    let result = {};
                    for (let key in value) {
                        try {
                            let field = value[key];
                            if (field instanceof types.RawType)
                                field = {type: field};

                            field = objectMap.initAndCheck({
                                target: field,
                                map: this.parameter_configuration,
                                data: end_point
                            });

                            if (util.isNullOrEmpty(key)) { // noinspection ExceptionCaughtLocallyJS
                                throw `cannot be empty`;
                            }
                            if (key !== key.trim()) { // noinspection ExceptionCaughtLocallyJS
                                throw `must be trimmed string`;
                            }
                            if (/[A-Z]/.test(key)) { // noinspection ExceptionCaughtLocallyJS
                                throw 'must be lower case';
                            }

                            let fieldType = types[field.type.constructor.name];
                            if (!fieldType.canBeParameter(end_point)) { // noinspection ExceptionCaughtLocallyJS
                                throw `${fieldType.name} cannot be parameter`;
                            }

                            result[key] = field;
                        } catch (error) {
                            throw `field '${key}' is invalid: ${error}`;
                        }
                    }
                    return result;
                },
            },

            raw_response: {
                default: false,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw 'must be Boolean type';

                    return value;
                },
            },

            response: {
                default: types.raw(),
                allow_null: false,
                parse: (value, end_point) => {
                    if (!(value instanceof types.RawType))
                        throw `must be delivery type of RawType`;

                    let valueType = types[value.constructor.name];
                    if (!valueType.canBeResponse(end_point))
                        throw `${valueType.name} cannot be response`;

                    if (end_point.paging && !(value instanceof types.ListType))
                        throw `${valueType.name} cannot be paging response`;

                    return value;
                }
            },

            error: {
                default: [],
                allow_null: false,
                parse: (value, end_point) => {
                    if (!Array.isArray(value))
                        throw `must be Array type`;

                    return value.map(item => objectMap.initAndCheck({target: item, map: this.error_configuration}));
                },
            },

            handle: {
                required: true,
                allow_null: false,
                parse: (value, end_point) => {
                    if (typeof value !== 'function')
                        throw 'must be Function type';

                    return value;
                },
            },
        };
    }

    static get field_configuration() {
        return {
            default: {
                parse: (value, parameter, end_point) => {
                    if (parameter.required)
                        return null;

                    types[parameter.type.constructor.name].check(value, parameter.type._data, 'parameter');

                    return value;
                },
            },

            required: {
                default: false,
                allow_null: false,
                parse: (value, parameter, end_point) => {
                    if (typeof value !== 'boolean')
                        throw 'must be Boolean type';

                    return value;
                },
            },

            allow_null: {
                default: true,
                allow_null: false,
                parse: (value, parameter, end_point) => {
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

            type: {
                required: true,
                allow_null: false,
                parse: (value, parameter, end_point) => {
                    if (!(value instanceof types.RawType))
                        throw 'must be delivery type of RawType';

                    return value;
                },
            },

            parse: {
                parse: (value, parameter, end_point) => {
                    if (!util.isNullOrUndefined(value) && typeof value !== 'function')
                        throw 'must be function type';

                    return value;
                },
            },
        };
    }

    static get parameter_configuration() {
        return Object.assign({
            allow_missing: {
                default: false,
                allow_null: false,
                parse: (value, parameter, end_point) => {
                    if (typeof value !== 'boolean')
                        throw 'must be Boolean type';

                    return value;
                },
            },
            location: {
                default: 'auto',
                allow_null: false,
                parse: (value, parameter, end_point) => {
                    if (typeof value !== 'string')
                        throw 'must string type';

                    if (value === 'auto') {
                        if (['GET', 'DELETE'].includes(end_point.method.toUpperCase()))
                            value = 'query';
                        else
                            value = 'body';
                    }

                    value = value.trim().toLowerCase();

                    if (!['path', 'query', 'header', 'body'].includes(value))
                        throw `must be 'path', 'query', 'header' or 'body'`;

                    return value;
                },
            },
        }, this.field_configuration);
    }

    static get error_configuration() {
        return {
            code: {
                required: true,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'string')
                        throw 'must be String type';

                    value = value.trim();

                    if (value.length === 0)
                        throw 'cannot be empty';

                    if (/[A-Z]/.test(value))
                        throw 'must be lower case';

                    return value;
                },
            },

            message: {
                required: true,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'string')
                        throw 'must be String type';

                    value = value.trim();

                    if (value.length === 0)
                        throw 'cannot be empty';

                    return value;
                },
            },
        };
    }

    static get end_point() {
        return end_point;
    }

    // ----------------------------------------------------------------------

    static register(data) {
        try {
            data = objectMap.initAndCheck({target: data, map: this.configuration});
        } catch (error) {
            throw `Register API failed [${data.method}] ${data.url}: ${error}`;
        }

        if (this.end_point.filter(x => x.method === data.method && x.url === data.url).length > 0)
            throw `Duplicate API: [${data.method}] ${data.url}`;

        // paging parameter
        if (data.paging) {
            data.parameter.page = {
                location: 'auto',
                default: 1,
                type: types.number({
                    description: 'vị trí trang dữ liệu',
                    min: 1,
                }),
            };
            data.parameter.page_size = {
                location: 'auto',
                default: 10,
                type: types.number({
                    description: 'kích thước trang dữ liệu',
                    min: 1,
                }),
            };

            data.parameter.page.location = this.parameter_configuration.location.parse('auto', data.parameter.page, data);
            data.parameter.page_size.location = this.parameter_configuration.location.parse('auto', data.parameter.page_size, data);
        }

        // shipping receive info parameter
        if (data.shipping_receive_info) {
            data.parameter.shipping_receive_address = {
                location: 'header',
                required: true,
                type: types.string({description: 'địa chỉ nhận hàng', allowEmpty: false}),
            };
            data.parameter.shipping_receive_lat = {
                location: 'header',
                required: true,
                type: types.number({description: 'toạ độ lat để nhận hàng'}),
            };
            data.parameter.shipping_receive_lng = {
                location: 'header',
                required: true,
                type: types.number({description: 'toạ độ lng để nhận hàng'}),
            };
            data.parameter.shipping_receive_time = {
                location: 'header',
                type: types.datetime({description: 'thời gian nhận hàng, để null nếu là "nhanh nhất có thể"'}),
                parse: (value) => {
                    if (util.isNullOrUndefined(value))
                        return value;
                    if (value.isBefore(moment()))
                        throw 'must from now or later';
                    return value;
                },
            };
        }

        // secret key
        if (data.require_secret_key && !util.isNullOrEmpty(config.apiServer.localSecretKey)) {
            let desc = 'local secret key';
            if (config.isDevelopment)
                desc += ' = ' + config.apiServer.localSecretKey;

            data.parameter.local_secret_key = {
                location: 'header',
                required: true,
                allow_null: false,
                type: types.string({description: desc, allowEmpty: false}),
            };

            data.error.push({
                code: 'local_secret_key_invalid',
                message: 'local secret key không chính xác'
            });
        }

        // authorization admin
        if (data.require_admin_auth) {
            data.parameter.admin_authorization = {
                location: 'header',
                required: true,
                allow_null: false,
                type: types.string({description: 'admin access token', allowEmpty: false}),
                parse: (value, config, end_point) => {
                    if (util.isNullOrEmpty(value))
                        throw 'cannot be empty';

                    return value;
                },
            };

            data.error.push({
                code: 'admin_authorization_invalid',
                message: 'phiên thao tác admin bị lỗi hoặc đã hết hạn'
            });
        }

        // authorization merchant
        if (data.require_merchant_auth) {
            data.parameter.merchant_authorization = {
                location: 'header',
                required: true,
                allow_null: false,
                type: types.string({description: 'merchant access token', allowEmpty: false}),
                parse: (value, config, end_point) => {
                    value = value.replace('JWT ', '');

                    if (util.isNullOrEmpty(value))
                        throw 'cannot be empty';

                    return value;
                },
            };

            data.error.push({
                code: 'merchant_authorization_invalid',
                message: 'phiên thao tác người dùng bị lỗi hoặc đã hết hạn'
            });
        }

        // authorization user
        if (data.require_user_auth) {
            data.parameter.user_authorization = {
                location: 'header',
                required: true,
                allow_null: false,
                type: types.string({description: 'user access token', allowEmpty: false}),
                parse: (value, config, end_point) => {
                    value = value.replace('JWT ', '');

                    if (util.isNullOrEmpty(value))
                        throw 'cannot be empty';

                    return value;
                },
            };

            data.error.push({
                code: 'user_authorization_invalid',
                message: 'phiên thao tác người dùng bị lỗi hoặc đã hết hạn'
            });
        }

        // permission group
        if (data.merchant_permission_group) {
            data.error.push({
                code: 'access_denied_by_group',
                message: 'bạn phải không đủ quyền (nhóm) để truy cập tính năng này'
            });
        }

        // default error
        if (!data.error.some(x => x.code === 'parameter_error'))
            data.error.push({code: 'parameter_error', message: 'tham số đầu vào bị lỗi'});
        if (!data.error.some(x => x.code === 'response_error'))
            data.error.push({code: 'response_error', message: 'kết quả xử lý bị lỗi'});

        this.end_point.push(data);
    }

    static get(data) {
        this.register(Object.assign(data, {method: 'GET'}));
    }

    static post(data) {
        this.register(Object.assign(data, {method: 'POST'}));
    }

    static put(data) {
        this.register(Object.assign(data, {method: 'PUT'}));
    }

    static delete(data) {
        this.register(Object.assign(data, {method: 'DELETE'}));
    }

    static async load(app) {
        for (let end_point of this.end_point) {
            if (!end_point.enable) {
                if (config.isDevelopment)
                    console.log(`Disable API: [${end_point.method}] ${end_point.url}`);
                continue;
            }

            if (end_point.dev_only && !config.isDevelopment)
                continue;

            let routeUrl = end_point.url;
            if (config.apiServer.path) {
                routeUrl = config.apiServer.path + routeUrl;
                if (!routeUrl.startsWith('/'))
                    routeUrl = '/' + routeUrl;
            }
            routeUrl = routeUrl.replace(/{/g, ':').replace(/}/g, '');

            if (end_point.swagger)
                await swagger.register({end_point});

            app[end_point.method](routeUrl, async (req, res) => await flow.process({req, res, end_point: end_point}));
        }
    }
};

require('./end-point/_test');
