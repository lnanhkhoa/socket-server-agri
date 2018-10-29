const api = require('../../../api');
const types = require('../../../core/types');
const dao = require('../../../database').dao;
const util = require('../../../core/util');
const moment = require('moment');

api.get({
    url: '/user/promotion',
    redmine: 519,
    tags: ['promotion'],
    summary: 'danh sách mã giảm giá',
    paging: true,
    parameter: {
        merchant_id: types.number({description: 'lọc các mã có thể áp dụng theo merchant chỉ định'}),
        store_id: types.number({description: 'lọc các mã có thể áp dụng theo cửa hàng chỉ định'}),
    },
    response: types.list(types.object({
        id: types.number({description: 'id mã'}),
        code: types.string({description: 'mã giảm giá'}),
        name: types.string({description: 'tên mã'}),
        image_link: types.string({description: 'link ảnh mô tả mã'}),
        start_date: types.datetime({description: 'thời gian bắt đầu áp dụng'}),
        end_date: types.datetime({description: 'thời gian kết thúc áp dụng'}),
        min_bill_money: types.number({description: 'tổng tiền thanh toán tối thiểu để được áp dụng'}),
        reduce_money_fixed: types.number({description: 'số tiền cứng được giảm trên tổng hóa đơn'}),
        reduce_money_percent: types.number({description: 'phần trăm số tiền được giảm trên tổng bill'}),
        max_reduce_money: types.number({description: 'số tiền tối đa được phép giảm trên tổng hóa đơn'}),
        reward_point_fixed: types.number({description: 'số điểm lixi cứng được tặng trên tổng hóa đơn'}),
        reward_point_percent: types.number({description: 'phần trăm số điển lixi được tặng trên tổng hóa đơn'}),
        max_reward_point: types.number({description: 'số điểm lixi tối đa được tặng trên tổng hóa đơn'}),
    })),
    handle: async function (arg) {
        let data = await dao.promotion.getPage({
            page: arg.page,
            page_size: arg.page_size,
            state: dao.promotion.config.STATE.ACTIVE,
            start_date: moment(),
            merchant_id: arg.merchant_id,
            store_id: arg.store_id,
            sort: [
                {col: 'priority', order: 'desc'},
                {col: 'name', order: 'asc'},
            ],
        });

        this.pagingTotal = data.total;
        return await util.mapAwait(data.items, async item => ({
            id: item.id,
            code: item.code,
            name: item.name,
            image_link: item.image_link,
            start_date: item.start_date ? moment(item.start_date) : null,
            end_date: item.end_date ? moment(item.end_date) : null,
            min_bill_money: item.min_bill_money,
            reduce_money_fixed: item.min_bill_money,
            reduce_money_percent: item.reduce_money_percent,
            max_reduce_money: item.max_reduce_money,
            reward_point_fixed: item.reward_point_fixed,
            reward_point_percent: item.reward_point_percent,
            max_reward_point: item.max_reward_point,
        }));
    },
});

api.get({
    url: '/user/promotion/detail',
    redmine: 521,
    tags: ['promotion'],
    summary: 'chi tiết mã giảm giá',
    parameter: {
        promotion_id: {
            required: true,
            type: types.number({description: 'id mã giảm giá'})
        },
    },
    response: types.object({
        id: types.number({description: 'id mã'}),
        code: types.string({description: 'mã giảm giá'}),
        name: types.string({description: 'tên mã'}),
        image_link: types.string({description: 'link ảnh mô tả mã'}),
        start_date: types.datetime({description: 'thời gian bắt đầu áp dụng'}),
        end_date: types.datetime({description: 'thời gian kết thúc áp dụng'}),
        min_bill_money: types.number({description: 'tổng tiền thanh toán tối thiểu để được áp dụng'}),
        reduce_money_fixed: types.number({description: 'số tiền cứng được giảm trên tổng hóa đơn'}),
        reduce_money_percent: types.number({description: 'phần trăm số tiền được giảm trên tổng bill'}),
        max_reduce_money: types.number({description: 'số tiền tối đa được phép giảm trên tổng hóa đơn'}),
        reward_point_fixed: types.number({description: 'số điểm lixi cứng được tặng trên tổng hóa đơn'}),
        reward_point_percent: types.number({description: 'phần trăm số điển lixi được tặng trên tổng hóa đơn'}),
        max_reward_point: types.number({description: 'số điểm lixi tối đa được tặng trên tổng hóa đơn'}),
    }),
    error: [
        {code: 'not_found', message: 'không tìm thấy dữ liệu'},
        {code: 'inactive', message: 'mã trạng thái inactive'},
        {code: 'promotion_not_started', message: 'mã chưa hiệu lực'},
        {code: 'promotion_expired', message: 'mã hết hạn'},
    ],
    handle: async function (arg) {
        let promotion = await dao.promotion.getById(arg.promotion_id);

        if (!promotion)
            throw {code: 'not_found'};
        if (promotion.state === dao.promotion.config.STATE.INACTIVE)
            throw {code: 'inactive'};
        if (promotion.start_date && moment().isBefore(promotion.start_date))
            throw {code: 'promotion_not_started'};
        if (promotion.end_date && moment().isAfter(promotion.end_date))
            throw {code: 'promotion_expired'};

        return {
            id: promotion.id,
            code: promotion.code,
            name: promotion.name,
            image_link: promotion.image_link,
            start_date: promotion.start_date ? moment(promotion.start_date) : null,
            end_date: promotion.end_date ? moment(promotion.end_date) : null,
            min_bill_money: promotion.min_bill_money,
            reduce_money_fixed: promotion.min_bill_money,
            reduce_money_percent: promotion.reduce_money_percent,
            max_reduce_money: promotion.max_reduce_money,
            reward_point_fixed: promotion.reward_point_fixed,
            reward_point_percent: promotion.reward_point_percent,
            max_reward_point: promotion.max_reward_point,
        }
    },
});

api.get({
    url: '/user/promotion/by_code',
    redmine: 522,
    tags: ['promotion'],
    summary: 'lấy mã giảm giá theo code',
    parameter: {
        code: {
            required: true,
            type: types.string({description: 'mã giảm giá'}),
        },
    },
    response: types.object({
        id: types.number({description: 'id mã'}),
        code: types.string({description: 'mã giảm giá'}),
        name: types.string({description: 'tên mã'}),
        image_link: types.string({description: 'link ảnh mô tả mã'}),
        start_date: types.datetime({description: 'thời gian bắt đầu áp dụng'}),
        end_date: types.datetime({description: 'thời gian kết thúc áp dụng'}),
        min_bill_money: types.number({description: 'tổng tiền thanh toán tối thiểu để được áp dụng'}),
        reduce_money_fixed: types.number({description: 'số tiền cứng được giảm trên tổng hóa đơn'}),
        reduce_money_percent: types.number({description: 'phần trăm số tiền được giảm trên tổng bill'}),
        max_reduce_money: types.number({description: 'số tiền tối đa được phép giảm trên tổng hóa đơn'}),
        reward_point_fixed: types.number({description: 'số điểm lixi cứng được tặng trên tổng hóa đơn'}),
        reward_point_percent: types.number({description: 'phần trăm số điển lixi được tặng trên tổng hóa đơn'}),
        max_reward_point: types.number({description: 'số điểm lixi tối đa được tặng trên tổng hóa đơn'}),
    }),
    error: [
        {code: 'not_found', message: 'không tìm thấy dữ liệu'},
        {code: 'inactive', message: 'mã trạng thái inactive'},
        {code: 'promotion_not_started', message: 'mã chưa hiệu lực'},
        {code: 'promotion_expired', message: 'mã hết hạn'},
    ],
    handle: async function (arg) {
        let data = await dao.promotion.getListByCode(arg.code, {
            state: dao.promotion.config.STATE.ACTIVE,
        });

        if (data.length !== 1)
            throw {code: 'not_found'};
        let promotion = data[0];
        if (promotion.start_date && moment().isBefore(promotion.start_date))
            throw {code: 'promotion_not_started'};
        if (promotion.end_date && moment().isAfter(promotion.end_date))
            throw {code: 'promotion_expired'};

        return {
            id: promotion.id,
            code: promotion.code,
            name: promotion.name,
            image_link: promotion.image_link,
            start_date: promotion.start_date ? moment(promotion.start_date) : null,
            end_date: promotion.end_date ? moment(promotion.end_date) : null,
            min_bill_money: promotion.min_bill_money,
            reduce_money_fixed: promotion.min_bill_money,
            reduce_money_percent: promotion.reduce_money_percent,
            max_reduce_money: promotion.max_reduce_money,
            reward_point_fixed: promotion.reward_point_fixed,
            reward_point_percent: promotion.reward_point_percent,
            max_reward_point: promotion.max_reward_point,
        };
    }
});