const PromiseA = require('bluebird');
const errs = require('errs');
const debug = require('debug')('rabbit:service:rpc:hash*');
var amqp = require('amqplib/callback_api');
var Connect = require('./connect');

const rpcQueue = 'rabbit:service:rpc:queue';
const rpcReplyExchange = 'rabbit:service:rpc:reply:exchange';

class RPC extends Connect {
    constructor(url) {
        super(url);
        this.rpcQueue = rpcQueue;
        this.rpcReplyExchange = rpcReplyExchange
    }

    async _connect() {
        await super._connect();
        let channel = await PromiseA.fromCallback(cb => this.conn.createChannel(cb));
        this.channel = channel;
        this.channel.assertQueue(this.rpcQueue, {durable: false});
        this.channel.assertExchange(this.rpcReplyExchange, 'fanout', {durable: false});
    }

}

module.exports = RPC;
