const Server = require('../src').RPCServer;

let server = new Server('amqp://nevem:nevem@localhost/order');
server.method('add', (a, b, i) => {
    console.log(i);
    return a + b;
});