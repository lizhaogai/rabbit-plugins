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
    }

    async _connect() {
        await super._connect();
        this.channel.assertQueue(this.rpcQueue, {durable: false}); //TODO queue ack and queue duration
        this.channel.assertExchange(this.rpcReplyExchange, 'fanout', {durable: false});
    }

}

module.exports = RPC;
