const PubSub = require('../src').PubSub;

let pub = new PubSub('amqp://nevem:nevem@localhost/order');


let i = 0;

pub.$promise.then(() => {

    setInterval(function () {
        i++;
        pub.publish('__test__', i)
    }, 1000);

});


