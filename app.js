const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
// io.on('connection', () => { console.log('io-connection harsh', arguments) });

io.on('connection', (socket) => {
    console.log('a user connected');
    io.emit('chat message client', 'user Connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
        io.emit('chat message client', 'user Disconnected');
    });
    socket.on('chat message server', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message client', msg);
    });

});


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
server.listen(3000);