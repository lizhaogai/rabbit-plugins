const Client = require('../src').RPCClient;

let client = new Client('amqp://nevem:nevem@localhost/order');

let i = 0;
client.$promise.then(() => {
    setInterval(async function () {
        i++;
        client.call('add', 1, 2, i).catch(e => {
            return e;
        }).then(result => {
            console.log(JSON.stringify(result) + ':' + i);
        })


    }, 1);
});

