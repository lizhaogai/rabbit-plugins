const PromiseA = require('bluebird');
const errs = require('errs');
const debug = require('debug')('rabbit:service:rpc:hash*');
var amqp = require('amqplib/callback_api');
var Client = require('./client');

const rpcQueue = 'rabbit:service:rpc:queue';
const rpcReplyExchange = 'rabbit:service:rpc:reply:exchange';

class RPC extends Client {
    constructor(opts) {
        super(opts);
        this.rpcQueue = rpcQueue;
        this.rpcReplyExchange = rpcReplyExchange
        this.queueOpts = {durable: true, autoDelete: false, messageTtl: 30000, expires: 3600000};
    }

    async _connect() {
        await super._connect();
        this.channel.assertQueue(this.rpcQueue, this.queueOpts); //TODO queue ack and queue duration
        this.channel.assertExchange(this.rpcReplyExchange, 'fanout');
    }

}

module.exports = RPC;
