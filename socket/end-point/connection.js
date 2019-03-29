const socket = require('../index');
const types = require('../../core/types');

socket.register({
    event: 'disconnect',
    tags: ['connection'],
    allow_emit: false,
    summary: 'sự kiện ngắt kết nối',
});

socket.register({
    event: 'connection/user_join',
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
    listen_handle: async function (params) {
        let joinChannels = [
            `user_${params.user_id}`
        ];
        for (let channel of joinChannels)
            this.socket.join(channel);

        return {
            user_id: params.user_id,
            list_channel: joinChannels,
        };
    },
});





socket.register({
    event: 'connection/admin_join',
    tags: ['connection'],
    summary: 'admin tham gia vào kênh socket',
    allow_emit: false,
    require_admin_auth: true,
    response: types.object({
        admin_id: types.string({ description: 'id admin' }),
        list_channel: types.list(types.string(), { description: 'các kênh tương tác' }),
    }),
    listen_handle: async function (arg) {
        let joinChannels = [
            `admin`,
            `admin_${this.currentAdminId}`
        ];

        for (let channel of joinChannels)
            this.socket.join(channel);

        return {
            admin_id: this.currentAdminId,
            list_channel: joinChannels,
        };
    },
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
    listen_handle: async function (params) {
        
    },
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
    listen_handle: async function (params) {
       console.log('nhan ket qua')
    },
});