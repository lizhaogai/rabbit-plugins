const PromiseA = require('bluebird');
const errs = require('errs');
const debug = require('debug')('rabbit:service:rpc:hash*');
var amqp = require('amqplib/callback_api');

const rpcQueue = 'rabbit:service:rpc:queue';
const rpcReplyExchange = 'rabbit:service:rpc:reply:exchange';

class RPC {
    constructor(url) {
        this.url = url;
        this.rpcQueue = rpcQueue;
        this.rpcReplyExchange = rpcReplyExchange
    }

    async _connect() {
        let conn = await PromiseA.fromCallback(cb => amqp.connect(this.url, cb)).catch(e => {
            debug(e);
            return null;
        });
        if (!conn) {
            throw errs.create({
                type: 'CONNECT_FAILURE',
                code: 400,
                status: 400,
                message: 'Connect to rpc server bus failure'
            });
        }

        this.conn = conn;
        let channel = await PromiseA.fromCallback(cb => this.conn.createChannel(cb));
        this.channel = channel;
        this.channel.assertQueue(this.rpcQueue, {durable: false});
        this.channel.assertExchange(this.rpcReplyExchange, 'fanout', {durable: false});
    }

    start() {
        this._connect().then(() => {
            this._start()
        })
        ;
    }
}

module.exports = RPC;
