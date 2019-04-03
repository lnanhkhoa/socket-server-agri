module.exports = {

    /*=============================================
    *        Databases Enum                            *
    =============================================*/
    device_type: ['Illuminance', 'Temperature', 'Humidity', 'Pressure', 'Light Control'],
    object_device: [
        {
            name: 'Light Control',
            url: '/3311/0',
            valueId: 5850,
            unitId: undefined,
            valueType: 'boolean',
        },
        {
            name: 'Illuminance',
            url: "/3301/0",
            valueId: 5700,
            unitId: 5701,
            valueType: 'number',
        },
        {
            name: 'Temperature',
            url: '/3303/0',
            valueId: 5700,
            unitId: 5701,
            valueType: 'number',
        },
        {
            name: 'Humidity',
            url: '/3304/0',
            valueId: 5700,
            unitId: 5701,
            valueType: 'number',
        },
        {
            name: 'Pressure',
            url: '/3323/0',
            valueId: 5700,
            unitId: 5701,
            valueType: 'number',
        },
    ]
    /*=====  End of Enum =========*/
}