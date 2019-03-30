



const socket = require('../../index');
const types = require('../../../core/types');

const handle = require('./handle')

socket.register({
    event: 'command_to_home_from_user',
    tags: ['dev'],
    summary: '',
    allow_emit: true,
    parameter: {
        from: types.string(),
        to: types.string(),
        command_type: types.string(),
        data: types.raw(),
    },
    response: types.object({
    }),
    listen_handle: handle.command_to_home_from_user
})


socket.register({
    event: 'response_to_user',
    tags: ['dev'],
    summary: 'remote control device from user',
    allow_emit: true,
    parameter: {
        from: types.string(),
        to: types.string(),
        response_command_type: types.string(),
        data: types.raw()
    },
    response: types.object({}),
    listen_handle: async function (params) {

    }
})



socket.register({
    event: 'get_all_home_state',
    tags: ['dev'],
    summary: 'get_all_home_state',
    allow_emit: true,
    parameter: {
        home_name: types.string()
    },
    response: types.object({
        data: types.raw()
    }),
    listen_handle: handle.get_all_home_state
})