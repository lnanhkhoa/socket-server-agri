const socket = require('../../index');

const handle = {}



handle.send_all_state_home = async function (params) {
    console.log('all saved')
    console.log(params.send_all_state_home.map(node=>node.data))
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
