const PromiseA = require('bluebird');
const uuid = require('uuid/v1');
const errs = require('errs');
const RPC = require('./rpc');
const moment = require('moment');

const debug = require('debug')('rabbit:service:rpc:hash*');

class Rpc_client extends RPC {
    constructor(opts) {
        opts = (typeof opts) === 'object' ? opts : {url: opts}
        super(opts.url);
        this.timeout = opts.timeout || 3000;
        this.replyInterval = null;
        this.waitings = {};
        this.start();
    }

    async _connect() {
        await super._connect();
        let rpcReplyQueue = await PromiseA.fromCallback(cb => this.channel.assertQueue('', {exclusive: true}, cb)).catch(e => {
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
    }

    async _client() {
        let that = this;
        this.channel.bindQueue(this.rpcReplyQueue.queue, this.rpcReplyExchange, '');
        this.channel.consume(this.rpcReplyQueue.queue, function (msg) {
            let instance = JSON.parse(msg.content.toString());
            let {id, result} = instance;
            // let newWaitingKeys = [];
            Object.keys(that.waitings).map(_id => {
                if (_id === id) {
                    that.waitings[id].resolve(result);
                    delete that.waitings[id];
                }
            });
        }, {noAck: true});
    }

    checkTimeout() {
        if (Object.keys(this.waitings).length == 0) {
            clearInterval(this.replyInterval);
            this.replyInterval = null;
            return;
        }


        Object.keys(this.waitings).map(id => {
            let waiting = this.waitings[id];
            try {
                this.waitings[id].time;
            } catch (e) {
                console.log('waitings:', this.waitings);
                // console.log('waitingKeys:', this.waitingKeys);
                console.log('id:', id);
                throw e;
            }
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
            // that.waitingKeys.push(id);
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

            that.channel.sendToQueue(that.rpcQueue, new Buffer(JSON.stringify({id, methodName, args, jsonrpc: '2.0'})));
        });
        p.timeout = function (timeout) {
            that.waitings[id].timeout = timeout || that.timeout;
        };
        return p;
    }

    async _start() {
        await this._client();
    }
}

module.exports = Rpc_client;
