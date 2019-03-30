const socket = require('../../index');
const types = require('../../../core/types');

const handle = require('./handle')

socket.register({
    event: 'disconnect',
    tags: ['connection'],
    allow_emit: false,
    summary: 'sự kiện ngắt kết nối',
});


socket.register({
    event: 'connection/home_join',
    tags: ['connection'],
    summary: 'người dùng tham gia vào kênh socket',
    allow_emit: true,
    parameter: {
        home_name: types.string(),
        token_key: types.string()
    },
    response: types.object({
        home_name: types.string({ description: 'home name' }),

    }),
    listen_handle: handle.home_join
});


socket.register({
    event: 'connection/user_join',
    tags: ['connection'],
    summary: 'người dùng tham gia vào kênh socket',
    allow_emit: true,
    parameter: {
        user_name: types.string()
    },
    response: types.object({
        user_name: types.string({ description: 'id user' }),
        list_channel: types.list(types.string(), { description: 'các kênh tương tác' }),
    }),
    listen_handle: handle.user_join
});


socket.register({
    event: 'connection/admin_join',
    tags: ['connection'],
    summary: 'admin tham gia vào kênh socket',
    // allow_emit: false,
    // require_admin_auth: true,
    response: types.object({
        admin_id: types.string({ description: 'id admin' }),
        list_channel: types.list(types.string(), { description: 'các kênh tương tác' }),
    }),
    listen_handle: handle.admin_join
});



socket.register({
    event: 'get_state_all_devices',
    tags: ['dev'],
    // summary: 'admin tham gia vào kênh socket',
    allow_emit: true,
    parameter: {
        a: types.number()
    },
    response: types.list(types.object({

    })),
    listen_handle: handle.get_state_all_devices
});

socket.register({
    event: 'event',
    tags: ['connection'],
    summary: 'người dùng tham gia vào kênh socket',
    allow_emit: true,
    parameter: {
        user_id: types.string()
    },
    response: types.object({
        user_id: types.string({ description: 'id user' }),
        list_channel: types.list(types.string(), { description: 'các kênh tương tác' }),
    }),
    listen_handle: handle.event
});