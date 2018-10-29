const api = require('../../../api');
const types = require('../../../core/types');
const dao = require('../../../database').dao;
const util = require('../../../core/util');
const moment = require('moment');

api.get({
    url: '/user/article',
    redmine: 485,
    tags: ['article'],
    summary: 'lấy danh sách chủ đề',
    paging: true,
    response: types.list(types.object({
        id: types.number({description: 'id chủ đề'}),
        name: types.string({description: 'tên chủ đề'}),
        image_link: types.string({description: 'link ảnh chủ đề'}),
    })),
    handle: async function (arg) {
        let data = await dao.article.getPage({
            page: arg.page,
            page_size: arg.page_size,
            state: dao.article.config.STATE.ACTIVE,
            sort: [
                {col: 'priority', order: 'desc'},
                {col: 'create_date', order: 'desc'},
            ],
        });

        this.pagingTotal = data.total;
        return await util.mapAwait(data.items, async item => ({
            id: item.id,
            name: item.name,
            image_link: item.image_link,
        }));
    },
});

api.get({
    url: '/user/article/detail',
    redmine: 486,
    tags: ['article'],
    summary: 'chi tiết chủ đề',
    parameter: {
        article_id: {
            required: true,
            type: types.number({description: 'id chủ đề'}),
        },
    },
    response: types.object({
        id: types.number({description: 'id chủ đề'}),
        name: types.string({description: 'tên chủ đề'}),
        image_link: types.string({description: 'link ảnh chủ đề'}),
    }),
    error: [
        {code: 'not_found', message: 'không tìm thấy dữ liệu'},
        {code: 'inactive', message: 'dữ liệu bị khóa'},
    ],
    handle: async function (arg) {
        let article = await dao.article.getById(arg.article_id);
        if (!article)
            throw {code: 'not_found'};
        if (article.state === dao.article.config.STATE.INACTIVE)
            throw {code: 'inactive'};

        return {
            id: article.id,
            name: article.name,
            image_link: article.image_link,
        }
    },
});