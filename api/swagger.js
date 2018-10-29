const config = require('../config');
const util = require('../core/util');

module.exports = {
    swagger: '2.0',
    basePath: config.apiServer.path,
    info: {
        title: 'Lixi Delivery APIs',
        version: '1.0',
        description:
        'Design: [Zeplin](https://app.zeplin.io/project/59d4ab95cca9a3170f71b59d)'
    },
    tags: [
        {
            name: 'article',
            description: 'chủ đề',
        },
        {
            name: 'store',
            description: 'cửa hàng',
        },
        {
            name: 'store_tag',
            description: 'phân loại cửa hàng',
        },
        {
            name: 'product',
            description: 'sản phẩm',
        },
        {
            name: 'promotion',
            description: 'mã giảm giá',
        },
        {
            name: 'payment',
            description: 'thánh toán',
        },
        {
            name: 'user_order',
            description: 'đơn đặt hàng của user',
        },
        {
            name: 'merchant_order',
            description: 'đơn đặt hàng của merchant',
        },
        {
            name: 'shipment_order',
            description: 'đơn đặt hàng của shipper',
        },
        {
            name: 'local',
            description: 'các api gọi nội bộ',
        },
        {
            name: 'dev',
            description: 'hàng đang dev hoặc đang kiểm duyệt',
        },
    ],
};