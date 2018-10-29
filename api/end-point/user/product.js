const api = require('../../../api');
const types = require('../../../core/types');
const dao = require('../../../database').dao;
const util = require('../../../core/util');

api.get({
    url: '/user/product/menu',
    redmine: 499,
    tags: ['product'],
    summary: 'danh sách sản phẩm của 1 cửa hàng',
    parameter: {
        store_id: {
            required: true,
            type: types.number({description: 'id cửa hàng'}),
        },
    },
    response: types.list(types.object({
        category_id: types.number({description: 'id nhóm'}),
        category_name: types.string({description: 'tên nhóm'}),
        list_product: types.list(types.object({
            id: types.number({description: 'id sản phẩm'}),
            name: types.string({description: 'tên sản phẩm'}),
            logo: types.string({description: 'logo sản phẩm'}),
            description: types.string({description: 'mô tả sản phẩm'}),
            price: types.number({description: 'giá sản phẩm'}),
            have_addon: types.boolean({description: 'có các mục tùy chọn hay không?'}),
            count_order: types.number({description: 'số lượng đã order thành công'}),
        }), {description: 'danh sách các sản phẩm thuộc nhóm'}),
    })),
    error: [
        {code: 'store_not_found', message: 'không tìm thấy dữ liệu'},
        {code: 'store_inactive', message: 'cửa hàng bị khóa'},
    ],
    handle: async function (arg) {
        let store = await dao.store.getById(arg.store_id);
        if (!store)
            throw {code: 'store_not_found'};
        if (store.state === dao.store.config.STATE.INACTIVE)
            throw {code: 'store_inactive'};

        let listCategory = await dao.product_category.getListByStoreId(store.id, {
            state: dao.product_category.config.STATE.ACTIVE,
            sort: [
                {col: 'priority', order: 'desc'},
                {col: 'name', order: 'asc'},
            ],
        });

        let result = [];
        for (let category of listCategory) {
            let listProduct = await dao.product.getListByCategoryId(category.id, {
                state: dao.product.config.STATE.ACTIVE,
                sort: [
                    {col: 'priority', order: 'desc'},
                    {col: 'name', order: 'asc'},
                ],
            });
            if (listProduct.length === 0)
                continue;

            let item = {
                category_id: category.id,
                category_name: category.name,
                list_product: [],
            };

            for (let product of listProduct) {
                let addonCount = await dao.product_addon.countByProductId(product.id, {
                    state: dao.product_addon.config.STATE.ACTIVE,
                });

                item.list_product.push({
                    id: product.id,
                    name: product.name,
                    logo: product.logo_link,
                    description: product.description,
                    price: product.price,
                    have_addon: addonCount > 0,
                    count_order: product.count_order,
                });
            }

            result.push(item);
        }
        return result;

    }
});

api.get({
    url: '/user/product/detail',
    tags: ['product'],
    redmine: 500,
    summary: 'chi tiết sản phẩm',
    parameter: {
        product_id: {
            required: true,
            type: types.number({description: 'id sản phẩm'}),
        },
    },
    response: types.object({
        id: types.number({description: 'id sản phẩm'}),
        name: types.string({description: 'tên sản phẩm'}),
        description: types.string({description: 'mô tả của sản phẩm'}),
        price: types.number({description: 'giá b sản phẩm'}),
        image_link: types.string({description: 'hình ảnh sản phẩm'}),
        count_order: types.number({description: 'số lượt đã đặt thành công'}),
        list_addon_category: types.list(types.object({
            id: types.number({description: 'id nhóm tùy chọn'}),
            name: types.string({description: 'tên nhóm tùy chọn'}),
            data_type: {
                type: types.string({description: 'dạng dữ liệu của nhóm tùy chọn'}),
                enum: ['boolean', 'number'],
            },
            required: types.boolean({description: 'bắt buộc phải có tùy chọn thuộc nhóm này?'}),
            multichoice: types.boolean({description: 'có thể chọn nhiều tùy chọn thuộc nhóm này?'}),
            min_total_number_value: types.number({description: 'tổng số lượng tối thiểu cho phép của các tùy chọn thuộc nhóm này (null là không giới hạn, dành cho data_type = number)'}),
            max_total_number_value: types.number({description: 'tổng số lượng tối đa cho phép của các tùy chọn thuộc nhóm này (null là không giới hạn, dành cho data_type = number)'}),
            list_addon: types.list(types.object({
                id: types.number({description: 'id tùy chọn'}),
                name: types.string({description: 'tên tùy chọn'}),
                description: types.string({description: 'mô tả tùy chọn'}),
                price_modifier: types.number({description: 'số tác động vào giá của sản phẩm (có thể là số âm)'}),
                min_number_value: types.number({description: 'số lượng tối thiểu cho phép của tùy chọn (null là không giới hạn, dành cho data_type = number)'}),
                max_number_value: types.number({description: 'số lượng tối đa cho phép của tùy chọn (null là không giới hạn, dành cho data_type = number)'}),
                default_value: types.raw({description: 'giá trị mặc định của tùy chọn'}),
            }), {description: 'danh sách tùy chọn'}),
        }), {description: 'danh sách các loại tùy chọn'}),
    }),
    error: [
        {code: 'not_found', message: 'không tìm thấy dữ liệu'},
        {code: 'inactive', message: 'sản phẩm bị khóa'},
    ],
    handle: async function (arg) {
        let product = await dao.product.getById(arg.product_id);
        if (!product)
            throw {code: 'not_found'};
        if (product.state === dao.product.config.STATE.INACTIVE)
            throw {code: 'inactive'};

        let result = {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image_link: product.image_link,
            count_order: product.count_order,
            list_addon_category: [],
        };

        let listAddonCategory = await dao.product_addon_category.getListByProductId(product.id, {
            state: dao.product_addon_category.config.STATE.ACTIVE,
            sort: [
                {col: 'priority', order: 'desc'},
                {col: 'name', order: 'asc'},
            ],
        });
        for (let addonCategory of listAddonCategory) {
            let listAddon = await dao.product_addon.getListByCategoryId(addonCategory.id, {
                state: dao.product_addon.config.STATE.ACTIVE,
                sort: [
                    {col: 'priority', order: 'desc'},
                    {col: 'name', order: 'asc'},
                ],
            });
            if (listAddon.length === 0)
                continue;

            let item = {
                id: addonCategory.id,
                name: addonCategory.name,
                data_type: addonCategory.data_type,
                required: addonCategory.required,
                multichoice: addonCategory.multichoice,
                min_total_number_value: addonCategory.min_total_number_value,
                max_total_number_value: addonCategory.max_total_number_value,
                list_addon: [],
            };

            let type = util.getTypeClassByName(addonCategory.data_type);
            for (let addon of listAddon) {
                item.list_addon.push({
                    id: addon.id,
                    name: addon.name,
                    description: addon.description,
                    price_modifier: addon.price_modifier,
                    default_value: type._parse(addon.default_value),
                    min_number_value: addon.min_number_value,
                    max_number_value: addon.max_number_value,
                });
            }

            result.list_addon_category.push(item);
        }

        return result;
    },
});