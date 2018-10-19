const Client = require('./client');
const uuid = require('uuid/v1');

class PubSub extends Client {
    constructor(opts) {
        opts = (typeof opts) === 'object' ? opts : {url: opts}
        super(opts);
        this.pubSubEx = 'rabbit:pubsub:ex';
        this.topicPrefix = opts.topicPrefix || 'rabbit:pubsub:';
        this.topicSuffix = opts.topicSuffix || ':$';
    }

    async _connect() {
        await super._connect();
        this.channel.assertExchange(this.pubSubEx, 'topic');
    }

    wrapTopic(topic) {
        return `${this.topicPrefix}${topic}${this.topicSuffix}`
    }

    publish(topic, message) {
        // topic = this.wrapTopic(topic);
        // message = (typeof message === 'string') ? message : JSON.stringify(message);
        // this.channel.publish(this.pubSubEx, topic, new Buffer(message));
        super.publish(this.pubSubEx, this.wrapTopic(topic), message);
    }

    subscribe(topic, fn) {
        // let that = this;
        // topic = this.wrapTopic(topic);
        // that.channel.assertQueue('', {exclusive: true}, function (err, q) {
        //     that.channel.bindQueue(q.queue, that.pubSubEx, topic);
        //     that.channel.consume(q.queue, function (msg) {
        //         let instance = JSON.parse(msg.content.toString());
        //         fn(instance);
        //     });
        // });

        this.route(this.wrapTopic(topic), {
            exchange: this.pubSubEx,
            exchangeType: 'topic',
            queue: uuid(),
            queueOpts: {exclusive: true}
        }, fn);
    }

}

module.exports = PubSub;
