const api = require('../../../api');
const types = require('../../../core/types');
const dao = require('../../../database').dao;
const util = require('../../../core/util');

api.get({
    url: '/user/store_tag',
    redmine: 484,
    tags: ['store_tag'],
    summary: 'danh sách phân loại cửa hàng',
    paging: true,
    parameter: {
        category_code: {
            required: true,
            type: types.string({
                description: `code nhóm của phân loại`,
                enum: Object.values(dao.store_tag_category.config.CODE),
            }),
        },
    },
    response: types.list(types.object({
        id: types.number({description: 'id của phân loại'}),
        name: types.string({description: 'tên phân loại'}),
        image_link: types.string({description: 'link ảnh phân loại'}),
    })),
    error: [
        {code: 'category_not_found', message: 'không tìm thấy phân loại'},
        {code: 'category_inactive', message: 'phân loại bị tắt'},
    ],
    handle: async function (arg) {
        let category = await dao.store_tag_category.getByCode(arg.category_code);
        if (!category)
            throw {code: 'category_not_found'};
        if (category.state === dao.store_tag_category.config.STATE.INACTIVE)
            throw {code: 'category_inactive'};

        let data = await dao.store_tag.getPage({
            page: arg.page,
            page_size: arg.page_size,
            sort: [
                {col: 'priority', order: 'desc'},
                {col: 'name', order: 'asc'},
            ],
            state: dao.store_tag.config.STATE.ACTIVE,
            list_category_code: [category.code],
        });

        this.pagingTotal = data.total;
        return await util.mapAwait(data.items, async item => ({
            id: item.id,
            name: item.name,
            image_link: item.image_link,
        }));
    },
});
