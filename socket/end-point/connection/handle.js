const socket = require('../../index');
// const types = require('../../../core/types');
// let io = require('../../../app').io;
const handle = {}

handle.disconnect = async function (params) {

}

handle.home_join = async function (params) {
    let joinChannels = [
        'home',
        params.home_name
    ];
    for (let channel of joinChannels)
        this.socket.join(channel)

    return {
        home_name: params.home_name,
        list_channel: joinChannels,
    };

}


handle.user_join = async function (params) {
    let joinChannels = [
        'user',
        params.user_name
        // 'home'
    ];
    for (let channel of joinChannels)
        this.socket.join(channel)

    return {
        user_name: params.user_name,
        list_channel: joinChannels,
    };

}

handle.admin_join = async function (params) {
    console.log(params)
    let joinChannels = [
        `admin`,
        `admin_${this.currentAdminId}`
    ];

    for (let channel of joinChannels)
        this.socket.join(channel);

    return {
        admin_id: this.currentAdminId,
        list_channel: joinChannels,
    };
}

handle.event = async (params) => { }
handle.get_state_all_devices = async function (params) {

}

handle.device_join = async function (params) {
    let joinChannels = [
        'device',
        // `device_${params.device_name}`
    ];
    for (let channel of joinChannels)
        this.socket.join(channel)

    return {
        device_name: params.device_name,
        // list_channel: joinChannels,
    };
};

module.exports = handle
