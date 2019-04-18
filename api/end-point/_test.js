const api = require('../index');
const _ = require('lodash')
const types = require('../../core/types');
const socket = require('../../socket');
const database = require('../../database/');
const dao = database.dao;
const static = require('../../database/static')

api.post({
    url: '/_test/emit',
    tags: ['dev'],
    // dev_only: true,
    parameter: {
        event: types.string(),
        data: types.raw(),
        to: types.list(types.string()),
    },
    response: types.object({
        res: types.string()
    }),
    handle: async function (params) {
        const res = await socket.emit(params)
        console.log(res)
    },
});



api.post({
    url: '/config/upsert',
    tags: ['dev'],
    parameter: {
        home_name: types.string(),
        data_config: types.list(types.object({
            index_garden: types.string(),
            mean_humidity_value: types.number(),
            about_time: types.number()
        })),
    },
    response: types.object({

    }),
    handle: async function (params) {
        const { data_config, home_name } = params
        const home_existed = await dao.home.getByNameUserId({
            home_name: home_name, user_id: 1
        })
        if (!home_existed) throw { code: 'home_not_found' }
        const data_config_mapping = data_config.map(async config => {
            const data_insert = {
                home_name: home_name,
                object_type: 'GARDEN',
                object_id: Number(config.index_garden),
                mean_humidity_value: config.mean_humidity_value,
                about_time: config.about_time
            }
            const resUpsert = await dao.config.upsert({
                home_name: home_name,
                object_type: 'GARDEN',
                object_id: Number(config.index_garden),
                config: data_insert
            })
            return data_insert
        });
        return Promise.all(data_config_mapping).then(async res => {
            await socket.emit({
                event: 'config_remote_pump_automatically',
                to: [home_name],
                data: {
                    from: 'server',
                    to: home_name,
                    command_type: 'config',
                    data: {
                        list_data: res
                    }
                }
            })
        })

        // const id = await dao.config.upsert({
        //     home_name: home_name, object_type: 'GARDEN', object_id: config.index_garden
        // })


    },
});


api.get({
    url: '/config/get',
    tags: ['dev'],
    parameter: {
        home_name: types.string(),
    },
    response: types.list(types.object({
        ...dao.config._schema()

    })),
    handle: async function (params) {
        const { home_name } = params
        const home_existed = await dao.home.getByNameUserId({
            home_name: home_name,
            user_id: 1
        })
        if (!home_existed) throw { code: 'home_not_found' }
        return await dao.config.getAll()
    },
});



api.get({
    url: '/garden/get_info',
    tags: ['dev'],
    parameter: {
        user_name: types.string(),
        user_token_key: types.string(),
        home_name: types.string(),
    },
    response: types.list(types.object({
        garden_id: types.number(),
        list_node_name: types.raw()

    })),
    handle: async function (params) {
        const { user_name, home_name, user_token_key } = params;
        const user_existed = await dao.user.getByNameTokenKey({
            user_name, token_key: user_token_key
        });
        if (!user_existed) throw { code: 'user_not_found' }
        const home_existed = await dao.home.getByNameUserId({
            home_name: home_name, user_id: user_existed.id
        });
        const home_id = home_existed.id;
        const list_node_existed = await dao.node.getListByHomeId(home_id);
        const list_node_in_garden = list_node_existed.filter(node => !!node.garden_id)
        const list_garden_id = _.uniq(list_node_in_garden.map(node => node.garden_id));
        return list_garden_id.map(garden_id => {
            return {
                garden_id: garden_id,
                list_node_name: _.map(_.filter(list_node_existed, node =>
                    node.garden_id === garden_id), node => node.node_name
                )
            }
        })

    },
});




api.get({
    url: '/user/all_home_current_state',
    tags: ['dev'],
    summary: 'trang thai hien tai cua tat ca',
    parameter: {
        user_name: types.string(),
        user_token_key: types.string(),
        home_name: types.string(),
    },
    response: types.list(types.object({
        ..._.omit(dao.node._schema(), ['id', 'node_uuid']),
        // unit: types.string({}),
        data_device: types.list(types.object({
            ..._.omit(dao.device._schema(), ['device_uuid', 'id', 'node_id']),
            value: types.number({}),
            created_at: types.datetime({})
        }))
    })),
    error: [
        { code: 'user_not_found', message: 'không tìm thấy dữ liệu user' },
        { code: 'inactive', message: 'dữ liệu bị khóa' },
    ],
    handle: async function (params) {

        const { user_name, user_token_key } = params
        const user_existed = await dao.user.getByNameTokenKey({
            user_name, token_key: user_token_key
        });
        if (!user_existed) throw { code: 'user_not_found' }

        const { home_name } = params
        const home_existed = await dao.home.getByNameUserId({
            home_name: home_name,
            user_id: user_existed.id
        })

        // start in here with dev mode
        const list_node_existed = await dao.node.getAll();

        const list_node_id = list_node_existed.map(node => node.id);
        const list_device_existed = await dao.device.getListByListNodeId(list_node_id);
        const list_device_id = list_device_existed.map(device => device.id);
        const _list_value_device = await dao.value_device.getListNewestByListDeviceId(list_device_id);
        const list_value_device = _.omitBy(_list_value_device, _.isNil);

        const data_device = list_device_existed.map(device => {
            const value_device = _.find(list_value_device, i => i.device_id === device.id);
            return {
                ...device,
                ..._.omit(value_device, 'device_id', 'unit')
            }
        })

        const list = list_node_existed.map(node => {
            const list_data_device = _.filter(data_device, device => device.node_id === node.id)
            return {
                ...node,
                data_device: list_data_device.map(device => ({ ..._.omit(device, ['node_id']) }))
            }
        })

        // console.log(list)
        return list
    },
});


api.post({
    url: '/user/remote_device',
    tags: ['dev'],
    parameter: {
        user_name: types.string(),
        user_token_key: types.string(),
        home_name: types.string(),
        node_name: types.string(),
        url: types.string(), //instead device_name
        value: types.boolean()
    },
    response: types.object({

    }),
    handle: async function (params) {
        const { user_name, user_token_key } = params
        const { home_name, node_name, url, value } = params

        const object_device = static.object_device;
        const controllable = _.find(object_device, obj => obj.url === url && !!obj.controllable)
        if (!controllable) throw { code: 'device_cant_remote' }

        const user_existed = await dao.user.getByNameTokenKey({
            user_name, token_key: user_token_key
        });
        if (!user_existed) throw { code: 'user_not_found' }

        // const { home_name } = params
        const home_existed = await dao.home.getByNameUserId({
            home_name: home_name,
            user_id: user_existed.id
        });
        if (!home_existed) throw { code: 'home_not_found' }

        const node_existed = await dao.node.getByHomeIdNodeName({
            home_id: home_existed.id,
            node_name: node_name,
        })

        const device_existed = await dao.device.getByUrlNodeId({
            url: url, node_id: node_existed.id
        });

        const res = await socket.emit({
            event: 'command_to_home',
            to: [home_name],
            data: {
                from: user_name,
                to: home_name,
                command_type: 'remote_device',
                data: {
                    node_name: node_name,
                    url: url,
                    value: value
                }
            }
        })
    },
})


api.get({
    url: '/user/get_all_info_device',
    tags: ['dev'],
    parameter: {
        user_name: types.string(),
        user_token_key: types.string(),
        home_name: types.string(),
        node_name: types.string(),
        url: types.string()
    },
    response: types.object({
        node_name: types.string(),
        device_name: types.string(),
        unit: types.string(),
        url: types.string(),
        data: types.list(types.object({
            time: types.string(),
            value: types.number()
        }))
    }),
    handle: async function (params) {
        const { user_name, user_token_key } = params
        const { home_name, node_name, url } = params
        const object_device = static.object_device;

        const user_existed = await dao.user.getByNameTokenKey({
            user_name, token_key: user_token_key
        });
        if (!user_existed) throw { code: 'user_not_found' }

        const home_existed = await dao.home.getByNameUserId({
            home_name: home_name,
            user_id: user_existed.id
        });
        if (!home_existed) throw { code: 'home_not_found' }

        const node_existed = await dao.node.getByHomeIdNodeName({
            node_name: node_name,
            home_id: home_existed.id
        })
        if (!node_existed) throw { code: 'node_not_found' }

        const device_existed = await dao.device.getByUrlNodeId({
            url: url, node_id: node_existed.id
        });
        if (!device_existed) throw { code: 'device_not_found' }

        const list_data_device_existed_mapped = await dao.value_device.getListMappedById(device_existed.id);
        const list_data = list_data_device_existed_mapped.map(dt => ({
            time: dt.created_at,
            value: dt.value
        }))

        return {
            node_name: node_existed.node_name,
            device_name: device_existed.device_name,
            url: device_existed.url,
            data: list_data

        }


    }
})



