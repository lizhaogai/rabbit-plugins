const Server = require('../').RPCServer;

let server = new Server({url: 'amqp://nevem:nevem@localhost/order', namespace: 'test'});
server.on('connected', () => {
    server.method('add', (a, b, i) => {
        console.log(i);
        return a + b;
    });
});

