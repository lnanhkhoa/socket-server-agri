const socket = require('../../index')


const handle = {}

handle.command_to_home_from_user = async function (params) {
    // console.log('command_to_home_from_user', params)
    // check user author and user access

    // send info to home
    const res = await socket.emit({
        event: 'command_to_home',
        to: [params.to],
        data: {
            from: params.from,
            to: params.to,
            command_type: params.command_type,
            data: params.data
        }
    })
    return {}
}

handle.get_all_home_state = async function (params) {
    console.log('get_all_home_state')
    return {
        data: {
            a: 123344
        }
    }
}



module.exports = handle
