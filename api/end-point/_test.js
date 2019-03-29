const api = require('../index');
const types = require('../../core/types');
const socket = require('../../socket');

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