const config = require('./config');
const cluster = require('cluster');
const http = require('http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const path = require('path');
const api = require('./api');
const socket = require('./socket');
const swagger = require('./core/swagger');

//region [cluster runner]

console.log('run in env', process.env.NODE_ENV)


if (cluster.isMaster && !config.isDevelopment) {
    let workerCount = config.cluster && config.cluster.workerCount ? config.cluster.workerCount : 1;
    for (let i = 0; i < workerCount; i += 1)
        cluster.fork();

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });

    return;
}

//endregion

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

// io.sockets.on('connection', function (socket) {
//     socket.emit('news', { hello: 'world' });
//     socket.on('my other event', function (data) {
//         console.log(data);
//     });
// });


(async () => {
    app.use(cors());
    app.use(compression());
    app.use(bodyParser.json({ limit: '100mb' }));
    app.use(bodyParser.urlencoded({ extended: true }));

    // load api end-points
    await api.load(app);

    // load socket
    await socket.load(app, io);

    // swagger
    if (config.isDevelopment) {
        app.get('/swagger/data.json', (req, res) => {
            swagger.reload().then(() => {
                res.setHeader('Content-Type', 'application/json');
                res.send(swagger.data);
            });
        });

        app.use('/swagger', express.static(path.join(__dirname, 'swagger')));
    }

    // // aglio
    // if (config.isDevelopment) {
    //     app.get('/aglio', (req, res) => {
    //         aglio.reload().then(() => {
    //             res.send(aglio.html);
    //         });
    //     });
    // }

    // default route
    if (config.isDevelopment)
        app.use((req, res) => res.redirect('/swagger'));

    server.listen(config.apiServer.port);

    if (config.isDevelopment)
        console.log(`Worker ${process.pid} started at http://localhost:${config.apiServer.port}`);
})();

module.exports = { app, io };