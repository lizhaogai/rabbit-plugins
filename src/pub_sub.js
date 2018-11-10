const Client = require('./client');
const uuid = require('uuid/v1');

class PubSub extends Client {
    constructor(opts) {
        opts = (typeof opts) === 'object' ? opts : {url: opts}
        super(opts);
        this.pubSubEx = opts.exchange ? `rabbit$${opts.exchange}$ex` : 'rabbit$pubsub$ex';
        this.topicPrefix = opts.topicPrefix || 'rabbit$pubsub$';
        this.topicSuffix = opts.topicSuffix || '$';
    }

    async _connect() {
        await super._connect();
        this.channel.assertExchange(this.pubSubEx, 'topic');
    }

    wrapTopic(topic) {
        return `${this.topicPrefix}${topic}${this.topicSuffix}`
    }

    publish(topic, message) {
        super.publish(this.pubSubEx, this.wrapTopic(topic), message);
    }

    subscribe(topic, fn) {
        this.route(this.wrapTopic(topic), {
            exchange: this.pubSubEx,
            exchangeType: 'topic',
            queue: uuid(),
            queueOpts: {exclusive: true}
        }, fn);
    }

}

module.exports = PubSub;
