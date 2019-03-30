const config = require('../config');
const objectMap = require('../core/object-map');
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

            event: {
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

            redmine: {
                parse: (value) => {
                    if (util.isNullOrUndefined(value))
                        return value;

                    if (typeof value !== 'number')
                        throw 'must be number type';

                    return value;
                },
            },

            allow_emit: {
                default: true,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw 'must be Boolean type';

                    return value;
                },
            },

            allow_listen: {
                default: true,
                allow_null: false,
                parse: (value) => {
                    if (typeof value !== 'boolean')
                        throw 'must be Boolean type';

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
                                field = { type: field };

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

                            result[key] = field;
                        } catch (error) {
                            throw `field '${key}' is invalid: ${error}`;
                        }
                    }
                    return result;
                },
            },

            response: {
                default: types.raw(),
                allow_null: false,
                parse: (value, end_point) => {
                    if (!(value instanceof types.RawType))
                        throw `must be delivery type of RawType`;

                    let valueType = types[value.constructor.name];

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

                    return value.map(item => objectMap.initAndCheck({ target: item, map: this.error_configuration }));
                },
            },

            emit_handle: {
                parse: (value, end_point) => {
                    if (util.isNullOrUndefined(value))
                        return null;

                    if (typeof value !== 'function')
                        throw 'must be Function type';

                    return value;
                },
            },

            listen_handle: {
                parse: (value, end_point) => {
                    if (util.isNullOrUndefined(value))
                        return null;

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
            data = objectMap.initAndCheck({ target: data, map: this.configuration });
        } catch (error) {
            throw `Register socket failed [${data.name}]: ${error}`;
        }

        if (this.end_point.filter(x => x.event === data.event).length > 0)
            throw `Duplicate socket: [${data.event}]`;

        // secret key
        if (data.require_secret_key && !util.isNullOrEmpty(config.apiServer.localSecretKey)) {
            let desc = 'local secret key';
            if (config.isDevelopment)
                desc += ' = ' + config.apiServer.localSecretKey;

            data.parameter.local_secret_key = {
                required: true,
                allow_null: false,
                type: types.string({ description: desc, allowEmpty: false }),
            };

            data.error.push({
                code: 'local_secret_key_invalid',
                message: 'local secret key không chính xác'
            });
        }

        // authorization admin
        if (data.require_admin_auth) {
            data.parameter.admin_authorization = {
                required: true,
                allow_null: false,
                type: types.string({ description: 'admin access token', allowEmpty: false }),
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
                required: true,
                allow_null: false,
                type: types.string({ description: 'merchant access token', allowEmpty: false }),
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
                required: true,
                allow_null: false,
                type: types.string({ description: 'user access token', allowEmpty: false }),
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
        if (!data.error.some(x => x.code === 'cannot_be_listen'))
            data.error.push({ code: 'cannot_be_listen', message: 'hàm không được phép gọi từ client' });
        if (!data.error.some(x => x.code === 'parameter_error'))
            data.error.push({ code: 'parameter_error', message: 'tham số đầu vào bị lỗi' });
        if (!data.error.some(x => x.code === 'response_error'))
            data.error.push({ code: 'response_error', message: 'kết quả xử lý bị lỗi' });

        this.end_point.push(data);
    }

    static async load(app, io) {
        for (let end_point of this.end_point) {
            if (!end_point.enable) {
                if (config.isDevelopment)
                    console.log(`Disable socket: [${end_point.method}] ${end_point.url}`);
                continue;
            }

            if (end_point.dev_only && !config.isDevelopment)
                continue;
        }

        // init test page
        if (config.isDevelopment)
            app.get('/test-socket', (req, res) => {
                res.sendFile(__dirname + '/test.html');
            });

        // init socket listener
        io.on('connection', socket => {
            for (let end_point of this.end_point) {
                if (!end_point.enable)
                    continue;

                if (end_point.dev_only && !config.isDevelopment)
                    continue;

                socket.on(end_point.event, (data, callback) => flow.processListen({
                    end_point, data, io, socket, callback
                }));
            }
        });
    }

    static async emit({ event, to, data = {} }) {
        let endPoint = this.end_point.filter(x => x.event === event)[0];
        if (!endPoint)
            throw { code: 'end_point_not_found', data: event };

        if (!to)
            throw { code: 'to_missing', data: to };
        if (!Array.isArray(to) || to.some(x => typeof x !== 'string'))
            throw { code: 'to_invalid', data: to };

        return await flow.processEmit({ end_point: endPoint, to, data });
    }
};

require('./end-point/connection');
require('./end-point/user');
require('./end-point/home');

// require('./end-point/user_order');