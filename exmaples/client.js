const Client = require('../src').RPCClient;

async function t() {
    let client = new Client('amqp://nevem:nevem@localhost/order');
    setInterval(async function () {
        let result = await client.call('add', 1, 2);
        console.log(result);
    }, 1000);
}

t();
