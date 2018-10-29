const socket = require('../socket');

const listenEvent = ['/user_order/state_changed'];

function emit() {
    let event = '/connection/admin_join';
    let data = {
        user_authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImxvZ2luIjoibHVjLnRhIiwiaWF0IjoxNTI2OTk4OTgxfQ.Is3n4hOaugTYwpprbCysI8kWAJ2flgngYHBQdcx99OU',
    };

    socket.emit(event, data, (result) => {
        console.log(`SEND [${event}]: ${JSON.stringify(result)}\n`)
    });
}

for (let event of listenEvent) {
    socket.on(event, (data) => {
        console.log(`LISTEN [${event}]: ${JSON.stringify(data)}\n`)
    });
}