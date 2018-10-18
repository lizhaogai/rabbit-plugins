const R = require('ramda');
const RPC = require('./rpc');

const debug = require('debug')('rabbit:service:rpc:hash*');

class Rpc_server extends RPC {

    constructor(url) {
        super(url);
        this.start();
        this._rpcHandlers = {};
    }

    async _server() {
        let that = this;
        that.channel.prefetch(1);
        this.channel.consume(this.rpcQueue, async function (msg) {
            try {
                let instance = JSON.parse(msg.content.toString());
                let {id, methodName, args} = instance;
                if (that._rpcHandlers[methodName]) {
                    const handler = R.propOr(R.always(null), methodName, that._rpcHandlers);
                    const data = await handler.apply(handler, args);
                    that.channel.publish(that.rpcReplyExchange, '', new Buffer(JSON.stringify({id, result: data})));
                }
            } catch (e) {
                debug(e);
            }
        }, {noAck: true});
    }


    _addMethod(methodName, fn) {
        this._rpcHandlers = this._rpcHandlers || {};
        this._rpcHandlers[methodName] = fn;
    };

    method(methodName, fn) {
        this._addMethod(methodName, fn)
    }

    methods(obj) {
        let that = this;
        R.toPairs(obj).forEach(([methodName, fn]) => that.addMethod(methodName, fn))
    }

    async _start() {
        await this._server();
    }
}


module.exports = Rpc_server;
