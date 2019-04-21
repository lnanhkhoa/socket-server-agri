module.exports = {

    /*=============================================
    *        Databases Enum                            *
    =============================================*/
    device_type: ['Illuminance', 'Temperature', 'Humidity', 'Soil Moisture', 'Soil Temp', 'Light Control'],
    object_device: [
        {
            name: 'Pump 1',
            url: '/3311/0',
            valueId: 5850,
            unitId: undefined,
            valueType: 'boolean',
            controllable: true
        },
        {
            name: 'Pump 2',
            url: '/3311/1',
            valueId: 5850,
            unitId: undefined,
            valueType: 'boolean',
            controllable: true
        },
        {
            name: 'Pump 3',
            url: '/3311/2',
            valueId: 5850,
            unitId: undefined,
            valueType: 'boolean',
            controllable: true
        },
        {
            name: 'Illuminance',
            url: "/3301/0",
            valueId: 5700,
            unitId: 5701,
            valueType: 'number',
            min_range: 0,
            max_range: 60000
        },
        {
            name: 'Temperature',
            url: '/3303/0',
            valueId: 5700,
            unitId: 5701,
            valueType: 'number',
            min_range: 5,
            max_range: 100
        },
        {
            name: 'Humidity',
            url: '/3304/0',
            valueId: 5700,
            unitId: 5701,
            valueType: 'number',
            min_range: 0,
            max_range: 100
        },
        {
            name: 'Soil Moisture',
            url: '/3323/0',
            valueId: 5700,
            unitId: 5701,
            valueType: 'number',
            min_range: 170,
            max_range: 850
        },
        {
            name: 'Soil Temp',
            url: '/3324/0',
            valueId: 5700,
            unitId: 5701,
            valueType: 'number',
            min_range: 5,
            max_range: 100
        },
    ]
    /*=====  End of Enum =========*/
}