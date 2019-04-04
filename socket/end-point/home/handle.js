const _ = require('lodash')
const socket = require('../../index');
const database = require('../../../database')
const static = require('../../../database/static')
const dao = database.dao;
const uuidv4 = require('uuid/v4')


const handle = {}
const subHandle = {}



subHandle.addInsertDevice = async function (info_node) {
    const list_device = info_node.data;
    const list_device_approve = _.reject(list_device, device => !_.includes(static.object_device.map(i => i.url), device.url))
    const list_device_url_approve = list_device_approve.map(device => device.url)

    const node_existed = await dao.node.getByAddress(info_node.address)
    if (!node_existed) console.log('node_not_found')
    const list_device_existed = await dao.device.getListByListNodeDeviceUrl({
        node_id: node_existed.id,
        list_device_url: list_device_url_approve
    })

    const list_device_approve_need_create = _.differenceBy(list_device, list_device_existed, 'url')
    //insert if not existed
    if (!!list_device_approve_need_create && list_device_approve_need_create.length > 0) {
        try {
            const list_device_approve_need_create_mapping = list_device_approve_need_create.map(device => ({
                device_uuid: uuidv4(),
                node_id: node_existed.id,
                url: device.url,
                device_name: device.name,
            }))
            console.log('list_insert', list_device_approve_need_create_mapping)
            const device_id = await dao.device.insertBulk(list_device_approve_need_create_mapping);

            return device_id
        } catch (error) {
            console.log(error)
        }
    }

    // insert value device
    const list_device_existed_next = await dao.device.getListByListNodeDeviceUrl({
        node_id: node_existed.id,
        list_device_url: list_device_url_approve
    })

    if (!!list_device_existed_next && list_device_existed_next.length > 0) {
        try {
            const list_value_device_mapping = list_device.map(device => {
                const device_existed_next = _.find(list_device_existed_next, device_existed_next => device_existed_next.url === device.url)
                return {
                    device_id: device_existed_next.id,
                    value: Number(device.value),
                    unit: device.unit
                }
            })
            console.log('list_insert', list_value_device_mapping)
            const value_id = await dao.value_device.insertBulk(list_value_device_mapping);
            return value_id
        } catch (error) {
            console.log(error)
        }
    }



}


subHandle.insertInfoNode = async function (list_info_node) {
    const list_endpoint = list_info_node.map(node => node.endpoint)
    const list_node_existed = await dao.node.getListByListNodeName(list_endpoint);
    const list_node_existed_compare = list_node_existed.map(node => ({
        ...node,
        endpoint: node.node_name
    }))
    const list_node_need_create = _.differenceBy(list_info_node, list_node_existed_compare, 'endpoint');
    if (!!list_node_need_create && list_node_need_create.length > 0) {
        try {
            const list_need_create_mapping = list_node_need_create.map(node => ({
                node_uuid: uuidv4(),
                home_id: 1,
                node_name: node.endpoint,
                registration_id: node.registrationId,
                address: node.address
            }))
            // console.log('list_insert', list_need_create_mapping)
            const node_id = await dao.node.insertBulk(list_need_create_mapping)
        } catch (error) {
            console.log(error)
        }
    }
}


handle.send_all_state_home = async function (params) {
    console.log('all saved data', params.send_all_state_home)
    const list_data = params.send_all_state_home
    const list_info_node = list_data.map(node => ({
        ..._.omit(node, ['data'])
    }))
    // console.log(list_info_node)


    const upsert_info_node = await subHandle.insertInfoNode(list_info_node)

    const p_addInfoDevice = list_data.map(async info_node => {
        const res = await subHandle.addInsertDevice(info_node)

    });

    const addInfoDevice = await Promise.all(p_addInfoDevice)

    return null
    // console.log('list_device_approve_need_create', list_device_approve_need_create)

}


handle.response_from_home_to_user = async function (params) {
    console.log('response_from_home_to_user', params)

    // send info to home
    const res = await socket.emit({
        event: 'response_to_user',
        to: [params.to],
        data: {
            from: params.from,
            to: params.to,
            response_command_type: params.response_command_type,
            data: params.data
        }
    })

    if (!res) return {
        success: false
    }

    return {
        success: true,
        event: 'command_to_home_from_user'
    }

}



module.exports = handle
