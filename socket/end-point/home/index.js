const socket = require('../../');
const types = require('../../../core/types');
const handle = require('./handle')

socket.register({
    event: 'command_to_home',
    tags: ['dev'],
    summary: 'send command to home from server',
    allow_emit: true,
    parameter: {
        from: types.string(),
        to: types.string(),
        command_type: types.string(),
        data: types.raw()
    },
    response: types.object({
        // success: types.boolean({})
    }),
    listen_handle: async function (params) {
        console.log('command_to_home')
    }
})

socket.register({
    event: 'config_remote_pump_automatically',
    tags: ['dev'],
    summary: 'send config to home from server',
    allow_emit: true,
    parameter: {
        from: types.string(),
        to: types.string(),
        command_type: types.string(),
        data: types.raw()
    },
    response: types.object({
    }),
    listen_handle: async function (params) {
        console.log('config_remote_pump_automatically')
    }
})






socket.register({
    event: 'send_all_state_home',
    tags: ['connection'],
    summary: 'nhan thong tin tu home',
    allow_emit: true,
    parameter: {
        send_all_state_home: types.list(types.object({
            endpoint: types.string(),
            registrationId: types.string(),
            address: types.string(),
            data: types.list(types.object({
                name: types.string(),
                url: types.string(),
                value: types.number(),
                unit: types.string(),
            })),
        })),
        is_forwarding: types.boolean(),
        info_forwarding: types.raw()
    },
    response: types.object({
    }),
    listen_handle: handle.send_all_state_home
});



socket.register({
    event: 'response_from_home_to_user',
    tags: ['dev'],
    summary: 'feedback data from home to user',
    allow_emit: true,
    parameter: {
        from: types.string(),
        to: types.string(),
        response_command_type: types.string(),
        data: types.raw()
    },
    response: types.object({

    }),
    listen_handle: handle.response_from_home_to_user
})