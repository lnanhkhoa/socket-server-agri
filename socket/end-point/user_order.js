const socket = require('../index');
const types = require('../../core/types');

socket.register({
    event: 'user_order/state_changed',
    redmine: 551,
    tags: ['user_order'],
    summary: 'đơn hàng bị thay đổi',
    parameter: {
        user_order_uuid: {
            required: true,
            allow_null: false,
            type: types.string({description: 'uuid đơn hàng'}),
        },
        old_state: {
            required: true,
            allow_null: false,
            type: types.string({
                description: 'trạng thái cũ',
                enum: ['draft', 'submitted', 'assigned', 'confirmed', 'picked', 'going', 'completed', 'cancelled'],
            }),
        },
        new_state: {
            required: true,
            allow_null: false,
            type: types.string({
                description: 'trạng thái mới',
                enum: ['draft', 'submitted', 'assigned', 'confirmed', 'picked', 'going', 'completed', 'cancelled'],
            }),
        },
    },
    listen_handle: async (arg) => {
        await socket.emit('user_order_state_changed', arg); // for test only
    }
});