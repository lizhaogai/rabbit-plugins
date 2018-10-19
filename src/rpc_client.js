const PromiseA = require('bluebird');
const uuid = require('uuid/v1');
const errs = require('errs');
const RPC = require('./rpc');
const moment = require('moment');

const debug = require('debug')('rabbit:service:rpc:client');

class Rpc_client extends RPC {
    constructor(opts) {
        opts = (typeof opts) === 'object' ? opts : {url: opts}
        super(opts);
        this.timeout = opts.timeout || 3000;
        this.replyInterval = null;
        this.waitings = {};
        this.debug = debug;
    }

    async _connect() {
        await super._connect();
        let queneOpts = this.queueOpts;
        queneOpts.exclusive = true;
        let rpcReplyQueue = await PromiseA.fromCallback(cb => this.channel.assertQueue('', queneOpts, cb)).catch(e => {
            debug(e);
            return null;
        });
        if (!rpcReplyQueue) {
            throw errs.create({
                type: 'CONNECT_FAILURE',
                code: 400,
                status: 400,
                message: 'Connect to rpc server bus failure'
            });
        }

        this.rpcReplyQueue = rpcReplyQueue;
        await this._client();
    }

    async _client() {
        let that = this;
        that.channel.bindQueue(this.rpcReplyQueue.queue, this.rpcReplyExchange, '');
        that.channel.consume(this.rpcReplyQueue.queue, function (msg) {
            let instance = that.codec.decode(msg.content.toString());
            let {id, result} = instance;
            Object.keys(that.waitings).map(_id => {
                if (_id === id) {
                    that.waitings[id].resolve(result);
                    delete that.waitings[id];
                }
            });
            that.channel.ack(msg);
        });
    }

    checkTimeout() {
        if (Object.keys(this.waitings).length == 0) {
            clearInterval(this.replyInterval);
            this.replyInterval = null;
            return;
        }
        Object.keys(this.waitings).map(id => {
            let waiting = this.waitings[id];
            if (moment().add(-waiting.timeout, 'milliseconds').isAfter(this.waitings[id].time)) {
                delete this.waitings[id];
                waiting.reject({
                    type: 'TIMEOUT',
                    code: 406,
                    status: 406,
                    message: 'Timeout to handle.'
                });
            }
        });
    }

    async call(methodName, ...args) {
        let that = this;
        let id = uuid();
        let p = new PromiseA(function (resolve, reject) {
            that.waitings[id] = {
                id,
                resolve,
                reject,
                timeout: that.timeout,
                time: moment()
            };

            if (!that.replyInterval) {
                that.replyInterval = setInterval(function () {
                    that.checkTimeout();
                }, 1000);
            }
            const body = that.codec.encode({id, methodName, args, jsonrpc: '2.0'});
            debug('Send remote call ', body);
            const content = that.bufferify(body);
            // that.channel.sendToQueue(that.rpcQueue, new Buffer(JSON.stringify({id, methodName, args, jsonrpc: '2.0'})));
            that.channel.sendToQueue(that.rpcQueue, content);
        });
        p.timeout = function (timeout) {
            that.waitings[id].timeout = timeout || that.timeout;
        };
        return p;
    }

}

module.exports = Rpc_client;
