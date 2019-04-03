const _ = require('lodash')
const socket = require('../../index');
const database = require('../../../database')
const dao = database.dao;
const uuid = require('uuid')


const handle = {}

handle.send_all_state_home = async function (params) {
    console.log('all saved')
    // console.log(params.send_all_state_home.map(node=>node.data))

    const list_data = params.send_all_state_home
    const list_info_node = list_data.map(node=>({
        ..._.omit(node, ['data'])
    }))
    console.log(list_info_node)

    // upsert info node
    const list_endpoint = list_info_node.map(node=>node.endpoint)
    const list_node_existed = await dao.node.getListByListNodeName(list_endpoint);
    const list_need_create = _.differenceBy(list_info_node, list_endpoint, 'endpoint')
    console.log(list_node_need_create);
    const list_need_create_mapping = list_node_need_create.map(node=>({
        node_uuid: 'a',
node_name:
registrationId:
address:
    }))
    if(!!list_node_need_create && list_node_need_create.length > 0){
        // insert
        try {
            const node_id = await dao.node.insertBulk(list_need_create_mapping)
        } catch (error) {
            console.log(error)
        }
    }

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
