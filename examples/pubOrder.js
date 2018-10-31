const PubSub = require('../src').PubSub;
const Server = require('../src').RPCServer;
const uuid = require('uuid').v1;

let pub = new PubSub('amqp://nevem:nevem@localhost/order');

let i = 0;
let ids = [];
pub.$promise.then(() => {
    setInterval(function () {
        let id = uuid();
        console.log('publish order:', {
            id,
            status: 'WAIT_PAY'
        });
        pub.publish('$$nevem_order$$', {
            id,
            status: 'WAIT_PAY'
        })
        ids.push(id);
    }, 30000);
});

pub.$promise.then(() => {
    setInterval(function () {
        ids.map(id => {
            console.log('publish order:', {
                id,
                status: 'PAY'
            });
            pub.publish('$$nevem_order$$', {
                id,
                status: 'PAY'
            })
        })
    }, 900 * 1000);
});

let server = new Server({url: 'amqp://nevem:nevem@localhost/order'});
server.on('connected', () => {
    server.method('affirmOrder', (id) => {
        console.log('affirmOrder:', id);
        return id;
    });
    server.method('reverseOrder', (id, type) => {
        console.log('reverseOrder:', id);
        return id + ':' + type;
    });
});



