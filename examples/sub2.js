const PubSub = require('../src').PubSub;

let pub = new PubSub('amqp://nevem:nevem@localhost/order');

pub.$promise.then(() => {
    console.log(1);
});

setTimeout(function(){
    pub.$promise.then(() => {
        console.log(2);
        pub.$promise.then(() => {
            console.log(3);
        });
    });
},10000);

