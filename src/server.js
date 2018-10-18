const R = require('ramda');
const RPC = require('./rpc');

const debug = require('debug')('rabbit:service:rpc:hash*');

class Server extends RPC {

    constructor(url) {
        super(url);
        this.start();
    }

    async _server() {
        let that = this;
        this.channel.consume(this.rpcQueue, async function (msg) {
            try {
                let instance = JSON.parse(msg.content.toString());
                let {id, methodName, args} = instance;
                const handler = R.propOr(R.always(null), methodName, that._rpcHandlers);
                if (handler) {
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


module.exports = Server;
