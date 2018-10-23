var Client = require('./client');

const rpcQueue = 'rabbit:service:rpc:queue';
const rpcReplyExchange = 'rabbit:service:rpc:reply:exchange';

class RPC extends Client {
    constructor(opts) {
        super(opts);
        this.rpcQueue = this.rpcQueue(opts.namespace);
        this.rpcReplyExchange = rpcReplyExchange;
        this.queueOpts = {durable: true, autoDelete: false, messageTtl: 30000, expires: 3600000};
    }

    rpcQueue(queue) {
        return `rabbit:service:${queue}:queue` || rpcQueue;
    }

    async _connect() {
        await super._connect();
        this.channel.assertQueue(this.rpcQueue, this.queueOpts);
        this.channel.assertExchange(this.rpcReplyExchange, 'fanout');
    }

}

module.exports = RPC;
