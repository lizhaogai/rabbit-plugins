const Connect = require('./connect');
const PromiseA = require('bluebird');

class PubSub extends Connect {
    constructor(opts) {
        opts = (typeof opts) === 'object' ? opts : {url: opts}
        super(opts.url);
        this._subscribeTopics = {};
        this.pubSubEx = 'rabbit:pubsub:ex';
        this.topicPrefix = opts.topicPrefix || 'rabbit:pubsub:';
        this.topicSuffix = opts.topicSuffix || ':$';
    }

    async _connect() {
        await super._connect();
        this.channel.assertExchange(this.pubSubEx, 'topic', {durable: false});
    }

    wrapTopic(topic) {
        return `${this.topicPrefix}${topic}${this.topicSuffix}`
    }

    publish(topic, message) {
        topic = this.wrapTopic(topic);
        message = (typeof message === 'string') ? message : JSON.stringify(message);
        this.channel.publish(this.pubSubEx, topic, new Buffer(message));
    }

    subscribe(topic, fn) {
        let that = this;
        topic = this.wrapTopic(topic);
        if (!this._subscribeTopics[topic]) {
            this._subscribeTopics[topic] = true;
            that.channel.assertQueue('', {exclusive: true}, function (err, q) {
                that.channel.bindQueue(q.queue, that.pubSubEx, topic);
                that.channel.consume(q.queue, function (msg) {
                    let instance = JSON.parse(msg.content.toString());
                    fn(instance);
                }, {noAck: true});
            });
        }
    }

}

module.exports = PubSub;
