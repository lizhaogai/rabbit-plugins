const Server = require('../').RPCServer;

let server = new Server({url: 'amqp://nevem:nevem@localhost/order', namespace: 'test1'});
server.on('connected', () => {
    console.log('connected success');
    server.method('sync', (str) => {
        return str;
    });
});
