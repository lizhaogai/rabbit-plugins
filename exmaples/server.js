const Server = require('../src').RPCServer;

async function t() {
    let server = new Server('amqp://nevem:nevem@localhost/order');
    server.method('add', (a, b) => a + b);
}

t();
