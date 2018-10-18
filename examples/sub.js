const PubSub = require('../src').PubSub;

let pub = new PubSub('amqp://nevem:nevem@localhost/order');

pub.$promise.then(() => {
    pub.subscribe('__test__', function (data) {
        console.log(data);
    });

});

