const Client = require('../src').RPCClient;

async function t() {
    let client = new Client('amqp://nevem:nevem@localhost/order');
    let i = 0;
    setInterval(async function () {
        let result = await client.call('add', 1, 2).catch(e => {
            return e;
        });
        i++;
        console.log(result + ':' + i);
    }, 10);
}

t();
