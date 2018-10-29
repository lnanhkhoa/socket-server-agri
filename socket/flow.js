const config = require('../config');
const types = require('../core/types');
const util = require('../core/util');
const axios = require('axios');

const flow = {};

flow.processEmit = async function ({end_point, to, data}) {
    let controller = {}, arg = {};

    try {
        if (end_point.allow_emit === false) { // noinspection ExceptionCaughtLocallyJS
            throw {code: 'cannot_be_emited', data: end_point.event};
        }

        let params = flow.parseParameter({end_point, data});

        let paramErrors = {};
        for (let key in params) {
            if (params[key].hasOwnProperty('error')) {
                paramErrors[key] = params[key].error;
                continue;
            }

            arg[key] = params[key].value;
        }

        if (Object.keys(paramErrors).length > 0) { // noinspection ExceptionCaughtLocallyJS
            throw {code: 'parameter_error', data: paramErrors};
        }

        controller = await flow.prepareController({end_point});

        // check secret key
        if (end_point.require_secret_key && !util.isNullOrEmpty(config.apiServer.localSecretKey))
            await flow.checkLocalSecretKey({end_point, controller, arg});

        // check admin auth
        if (end_point.require_admin_auth)
            await flow.checkAdminSession({end_point, controller, arg});

        // check merchant auth
        if (end_point.require_merchant_auth)
            await flow.checkMerchantSession({end_point, controller, arg});
        if (end_point.merchant_permission_group)
            await flow.checkMerchantPermission({end_point, controller, arg});

        // check user auth
        if (end_point.require_user_auth)
            await flow.checkUserSession({end_point, controller, arg});

        if (end_point.emit_handle) {
            let result = await end_point.emit_handle.bind(controller.method)(Object.assign({}, arg));
            result = flow.parseParameter({end_point, result});

            if (result) {
                let resultErrors = {};
                for (let key in result) {
                    if (result[key].hasOwnProperty('error')) {
                        resultErrors[key] = result[key].error;
                        continue;
                    }

                    arg[key] = result[key].value;
                }

                if (Object.keys(paramErrors).length > 0) { // noinspection ExceptionCaughtLocallyJS
                    throw {code: 'response_error', data: resultErrors};
                }
            }
        }

        let io = require('../app').io;
        for (let room of to)
            io.to(room).emit(end_point.event, arg);
    } catch (e) {
        throw flow.errorHandler({end_point, e});
    }
};

flow.processListen = async function ({end_point, data, io, socket, callback}) {
    let controller = {}, arg = {}, result;

    try {
        if (end_point.allow_listen === false) { // noinspection ExceptionCaughtLocallyJS
            throw {code: 'cannot_be_listen', data: end_point.event};
        }

        let params = flow.parseParameter({end_point, data});

        let paramErrors = {};
        for (let key in params) {
            if (params[key].hasOwnProperty('error')) {
                paramErrors[key] = params[key].error;
                continue;
            }

            arg[key] = params[key].value;
        }

        if (Object.keys(paramErrors).length > 0) { // noinspection ExceptionCaughtLocallyJS
            throw {code: 'parameter_error', data: paramErrors};
        }

        controller = await flow.prepareController({end_point, io, socket});

        // check secret key
        if (end_point.require_secret_key && !util.isNullOrEmpty(config.apiServer.localSecretKey))
            await flow.checkLocalSecretKey({end_point, controller, arg});

        // check admin auth
        if (end_point.require_admin_auth)
            await flow.checkAdminSession({end_point, controller, arg});

        // check merchant auth
        if (end_point.require_merchant_auth)
            await flow.checkMerchantSession({end_point, controller, arg});
        if (end_point.merchant_permission_group)
            await flow.checkMerchantPermission({end_point, controller, arg});

        // check user auth
        if (end_point.require_user_auth)
            await flow.checkUserSession({end_point, controller, arg});

        if (end_point.listen_handle)
            result = await end_point.listen_handle.bind(controller.method)(Object.assign({}, arg));

        try {
            result = flow.parseResult({end_point, data: result});
        } catch (parse_error) { // noinspection ExceptionCaughtLocallyJS
            throw {code: 'response_error', data: parse_error}
        }
    } catch (e) {
        let error = flow.errorHandler({end_point, e});
        flow.sendResponse({end_point, callback, is_success: false, data: error});
        return;
    }

    flow.sendResponse({end_point, callback, is_success: true, controller: controller, arg: arg, data: result});
};

flow.parseParameter = function ({end_point, data}) {
    let result = {};

    for (let paramKey in end_point.parameter) {
        let param = end_point.parameter[paramKey];
        result[paramKey] = {};

        //region [get value]

        let value = undefined;
        let found = data.hasOwnProperty(paramKey);

        if (found)
            value = data[paramKey];
        else if (param.required === false && param.allow_missing === false && param.hasOwnProperty('default')) {
            found = true;
            value = typeof param.default === 'function' ? param.default(end_point) : param.default;
        }

        //endregion

        //region [required]

        if (!found && param.required === true) {
            result[paramKey].error = {
                code: 'required',
                message: `field is required`,
            };
            continue;
        }

        //endregion

        //region [allow missing]

        if (!found && param.allow_missing === true) {
            continue;
        }

        //endregion

        //region [allow null]

        if (value === null)
            value = undefined;
        if (value === undefined && param.allow_null === false) {
            result[paramKey].error = {
                code: 'not_allow_null',
                message: `field cannot be null`,
            };
            continue;
        }

        //endregion

        //region [parse]

        try {
            value = types[param.type.constructor.name].parse(value, param.type._data, 'parameter');
            if (!util.isNullOrUndefined(param.parse))
                value = param.parse(value, param.type._data, end_point);
        } catch (error) {
            result[paramKey].error = {
                code: 'parse_error',
                message: error,
            };
        }

        //endregion

        //region [check & modifier]

        if (param.preCheckModifier)
            value = param.preCheckModifier(value);

        if (param.check)
            try {
                param.check(value);
            } catch (error) {
                result[paramKey].error = {
                    code: 'invalid',
                    message: error,
                };
                continue;
            }

        if (param.postCheckModifier)
            value = param.postCheckModifier(value);

        //endregion

        result[paramKey].value = value;
    }

    return result;
};

flow.prepareController = function ({end_point, io, socket}) {
    let controller = {};

    controller.data = {
        io, socket,
        currentAdmin: undefined,
        currentMerchant: undefined,
        currentUser: undefined,
    };

    controller.method = {
        get io() {
            return controller.data.io;
        },

        get socket() {
            return controller.data.socket;
        },

        get currentAdminId() {
            return controller.data.currentAdmin ? controller.data.currentAdmin.id : undefined;
        },

        get currentMerchantId() {
            return controller.data.currentMerchant ? controller.data.currentMerchant.id : undefined;
        },

        get currentMerchantGroup() {
            return controller.data.currentMerchant ? controller.data.currentMerchant.group : undefined;
        },

        get currentUserId() {
            return controller.data.currentUser ? controller.data.currentUser.id : undefined;
        },
    };

    return controller;
};

flow.checkLocalSecretKey = async function ({end_point, controller, arg}) {
    let secretKey = config.apiServer.localSecretKey;

    if (arg.local_secret_key !== secretKey)
        throw {code: 'local_secret_key_invalid'};
};

flow.checkAdminSession = async function ({end_point, controller, arg}) {
    try {
        let session;
        try {
            session = await axios({
                method: 'GET',
                url: config.session.adminCheckUrl,
                headers: {
                    authorization: arg.admin_authorization,
                }
            });
            session = session.data.data;
        } catch (e) { // noinspection ExceptionCaughtLocallyJS
            throw e.response.data.error;
        }

        controller.data.currentAdmin = {
            id: session.id,
        };

    } catch (e) {
        throw {code: 'admin_authorization_invalid', data: e};
    }
};

flow.checkMerchantSession = async function ({end_point, controller, arg}) {
    try {
        let session;
        try {
            session = await axios({
                method: 'GET',
                url: config.session.merchantCheckUrl,
                headers: {
                    authorization: arg.user_authorization,
                }
            });
            session = session.data.records;
        } catch (e) { // noinspection ExceptionCaughtLocallyJS
            throw e.response.data.records;
        }

        let currentMerchant = {
            id: session.id,
            group: [],
        };
        if (session.level === 'merhant')
            currentMerchant.group.push('merchant');
        else if (session.level === 'cashier')
            currentMerchant.group.push('cashier');
        else { // noinspection ExceptionCaughtLocallyJS
            throw 'account is not merchant type';
        }

        controller.data.currentMerchant = currentMerchant;

    } catch (e) {
        throw {code: 'user_authorization_invalid', data: e};
    }
};

flow.checkMerchantPermission = function ({end_point, controller, arg}) {
    for (let group of end_point.merchant_permission_group) {
        if (!controller.data.currentMerchant.group.includes(group))
            throw {code: 'access_denied_by_group', data: group};
    }
};

flow.checkUserSession = async function ({end_point, controller, arg}) {
    try {
        let session;
        try {
            session = await axios({
                method: 'GET',
                url: config.session.userCheckUrl,
                headers: {
                    authorization: arg.user_authorization,
                }
            });
            session = session.data.records;
        } catch (e) { // noinspection ExceptionCaughtLocallyJS
            throw e.response.data.records;
        }

        if (session.level !== 'enduser') { // noinspection ExceptionCaughtLocallyJS
            throw 'account is not user type';
        }

        controller.data.currentUser = {id: session.id};

    } catch (e) {
        throw {code: 'user_authorization_invalid', data: e};
    }
};

flow.parseResult = function ({end_point, data}) {
    if (end_point.raw_response)
        return data;

    return types[end_point.response.constructor.name].parse(data, end_point.response._data, 'response');
};

flow.errorHandler = function ({end_point, e}) {
    let error = {};

    if (config.isDevelopment)
        error.raw = e;

    if (typeof e !== 'object' || !e.hasOwnProperty('code'))
        error = {code: 'exception', message: e.toString()};
    else
        error.code = e.code;

    if (!error.message) {
        let codeError = end_point.error.filter(x => x.code === error.code)[0];
        if (codeError) error.message = codeError.message;
    }

    if (e.hasOwnProperty('data'))
        error.data = e.data;

    return error;
};

flow.sendResponse = function ({end_point, callback, is_success, controller, arg, data}) {
    if (typeof callback !== 'function')
        return;


    let response = {};

    if (end_point.raw_response) {
        response = data;
    } else {
        response.meta = {
            success: is_success,
        };

        if (is_success)
            response.data = data;
        else
            response.error = data;
    }

    callback(response);
};

module.exports = flow;