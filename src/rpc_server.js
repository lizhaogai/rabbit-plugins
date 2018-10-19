const R = require('ramda');
const RPC = require('./rpc');

const debug = require('debug')('rabbit:service:rpc:server');

class Rpc_server extends RPC {

    constructor(url) {
        super(url);
        this._rpcHandlers = {};
    }

    async _connect() {
        await super._connect();
        await this._server();
    }

    async _server() {
        let that = this;
        that.channel.prefetch(1);
        this.channel.consume(this.rpcQueue, async function (msg) {
            try {
                // let instance = JSON.parse(msg.content.toString());
                debug('Receive remote call ', msg.content.toString());
                let instance = that.codec.decode(msg.content.toString());
                let {id, methodName, args} = instance;
                if (that._rpcHandlers[methodName]) {
                    const handler = R.propOr(R.always(null), methodName, that._rpcHandlers);
                    const data = await handler.apply(handler, args);
                    const content = that.bufferify(that.codec.encode({id, result: data}));
                    that.channel.publish(that.rpcReplyExchange, '', content);
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

}


module.exports = Rpc_server;
