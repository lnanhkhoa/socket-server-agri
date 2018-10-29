const config = require('../config');
const types = require('./types');
const util = require('./util');
const axios = require('axios');
const moment = require('moment');

module.exports = {
    data: require('../api/swagger'),

    register: async function ({end_point, load_redmine = false}) {
        //region [prepare]

        let url = end_point.url;
        if (!this.data.hasOwnProperty('paths'))
            this.data.paths = {};
        if (!this.data.paths.hasOwnProperty(url))
            this.data.paths[url] = {};

        let route = {};
        route.summary = '';
        route.description = '';

        //endregion

        //region [redmine]

        if (load_redmine && !util.isNullOrUndefined(end_point.redmine)) {
            try {
                let issue = (await axios({
                    method: 'GET',
                    timeout: config.redmine.requestTimeout,
                    url: `${config.redmine.host}/issues/${end_point.redmine}.json`,
                    headers: {
                        'X-Redmine-API-Key': config.redmine.apiKey,
                    }
                })).data.issue;

                // summary
                route.summary = `#${end_point.redmine} - `;

                // external docs
                route.externalDocs = {
                    description: 'Redmine',
                    url: `${config.redmine.host}/issues/${end_point.redmine}`,
                };

                // update date
                let updateDate = moment(issue.updated_on);
                route.update_date = updateDate.valueOf();
                route.description += `Lần cập nhật cuối: **${updateDate.format('DD-MM-YYYY')}** lúc **${updateDate.format('HH:mm')}**\n`;

                // developer
                let developer = issue.custom_fields.filter(x => x.name === 'Developer')[0];
                if (developer && !util.isNullOrEmpty(developer.value)) {
                    developer = (await axios({
                        method: 'GET',
                        url: `${config.redmine.host}/users/${developer.value}.json`,
                        headers: {
                            'X-Redmine-API-Key': config.redmine.apiKey,
                        }
                    })).data.user;
                } else
                    developer = null;

                route.description += `Chỉnh sửa: **${developer.firstname} ${developer.lastname}**\n`;

                route.description += `Tiến độ: **${issue.status.name}**\n`;
            } catch (e) {
                console.log(`Error while create swagger for [${end_point.method} ${url}]: ${e}`);
            }
        }

        //endregion

        //region [metadata]

        route.produces = ['application/json'];

        if (!end_point.enable)
            route.deprecated = true;
        if (!util.isNullOrEmpty(end_point.tags))
            route.tags = end_point.tags;
        if (!util.isNullOrEmpty(end_point.summary))
            route.summary += end_point.summary;
        if (!util.isNullOrEmpty(end_point.description))
            route.description += end_point.description;

        //endregion

        //region [parameter]

        let parameters = [];
        let bodyParam;
        for (let key in end_point.parameter) {
            let paramConfig = end_point.parameter[key];
            let paramType = types[paramConfig.type.constructor.name];

            if (paramConfig.location !== 'body') {
                parameters.push(Object.assign({
                    name: key,
                    in: paramConfig.location,
                    required: paramConfig.required,
                }, paramType.swaggerInfo(Object.assign({default: paramConfig.default}, paramConfig.type._data), 'parameter')));
            } else {
                bodyParam = parameters.filter(x => x.name === 'body')[0];

                if (util.isNullOrUndefined(bodyParam)) {
                    bodyParam = {
                        name: 'body',
                        in: 'body',
                        required: true,
                        schema: {
                            'type': 'object',
                            'properties': {},
                        },
                    };
                    parameters.push(bodyParam);
                }

                bodyParam.schema.properties[key] = paramType.swaggerInfo(Object.assign({default: paramConfig.default}, paramConfig.type._data), 'parameter');

                if (paramConfig.required) {
                    if (util.isNullOrEmpty(bodyParam.schema.required))
                        bodyParam.schema.required = [];
                    bodyParam.schema.required.push(key);
                }
            }
        }

        if (!util.isNullOrEmpty(parameters))
            route.parameters = parameters;

        //endregion

        //region [response]

        route.responses = {};

        // response 200
        if (util.isNullOrUndefined(end_point.response))
            route.responses[200] = {description: 'xử lý thành công'};
        else {
            let responseConfig = end_point.response._data;
            let responseType = types[end_point.response.constructor.name];

            if (end_point.raw_response) {
                route.responses[200] = {
                    description: 'kết quả xử lý',
                    schema: responseType.swaggerInfo(responseConfig, 'response'),
                };
            }
            else {
                // define meta
                let meta = {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true,
                            description: 'kết quả xử lý không bị lỗi?'
                        },
                    }
                };

                // paging meta
                if (end_point.paging) {
                    meta.properties.total = {type: 'integer', description: 'tổng số lượng mục dữ liệu'};
                    meta.properties.page = {type: 'integer', description: 'vị trí trang hiện tại'};
                    meta.properties.page_size = {type: 'integer', description: 'số lượng mục dữ liệu mỗi trang'};
                    meta.properties.page_count = {type: 'integer', description: 'số lượng trang'};
                    meta.properties.have_prev_page = {
                        type: 'boolean',
                        description: 'có trang dữ liệu tiếp theo không?'
                    };
                    meta.properties.have_next_page = {
                        type: 'boolean',
                        description: 'có trang dữ liệu phía trước không?'
                    };
                }

                route.responses[200] = {
                    description: 'kết quả xử lý',
                    schema: {
                        type: 'object',
                        properties: {
                            meta: meta,
                            data: responseType.swaggerInfo(responseConfig, 'response'),
                        },
                    }
                };
            }
        }

        // response 500
        route.responses[500] = {
            description: 'lỗi trong qua trình xử lý',
            schema: {
                type: 'object',
                properties: {
                    meta: {
                        type: 'object',
                        properties: {
                            success: {
                                type: 'boolean',
                                example: false,
                                description: 'kết quả xử lý không bị lỗi?'
                            }
                        }
                    },
                    error: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'mã lỗi',
                            },
                            message: {
                                type: 'string',
                                description: 'thông báo lỗi',
                            },
                            data: {
                                type: 'object',
                                description: 'dữ liệu hỗ trợ xử lý lỗi',
                            },
                        }
                    }
                }
            }
        };

        if (config.isDevelopment)
            route.responses[500].schema.properties.error.properties.raw = {
                type: 'object',
                description: 'lỗi gốc từ server',
            };

        //endregion

        //region [error]

        route.responses['exception'] = {description: 'lỗi không xác định'};

        for (let item of end_point.error)
            route.responses[item.code] = {description: item.message};

        //endregion

        this.data.paths[url][end_point.method] = route;
    },

    reload: async function () {
        const api = require('../api');

        let tasks = [];
        for (let end_point of api.end_point) {
            if (!end_point.swagger)
                continue;

            tasks.push(this.register({
                end_point: end_point,
                load_redmine: true,
            }));
        }
        await Promise.all(tasks);
    },
};