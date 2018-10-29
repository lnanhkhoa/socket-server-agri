const api = require('../index');
const types = require('../../core/types');
const socket = require('../../socket');

api.post({
    url: '/local/socket_test',
    tags: ['dev'],
    dev_only: true,
    parameter: {
        event: types.string(),
        data: types.raw(),
        to: types.list(types.string()),
    },
    handle: async function (arg) {
        await socket.emit(arg)
    },
});