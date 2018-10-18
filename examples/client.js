const Client = require('../src').RPCClient;

let client = new Client('amqp://nevem:nevem@localhost/order');

setTimeout(async function () {
    for (let i = 0; i < 10000; i++) {
        client.call('add', 1, 2, i).catch(e => {
            return e;
        }).then(result => {
            console.log(JSON.stringify(result) + ':' + i);
        })

    }

}, 1000);
