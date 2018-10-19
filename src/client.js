const PromiseA = require('bluebird');
const EventEmitter = require('events').EventEmitter;
const errs = require('errs');
const debug = require('debug')('rabbit:service:rpc');
const util = require('util');
const amqp = require('amqplib/callback_api');
const codecs = require('./codecs');
const Router = require('./router');

class Client {
    constructor(opts) {
        opts = (typeof opts) === 'object' ? opts : {url: opts};
        this.opts = opts = opts || {};
        this.url = opts.url;
        this.conn = null;
        this.channel = null;
        this.connected = false;
        this.routers = [];
        this.$promise = null;
        this.format(this.opts.format || 'json');
        // this.codec = codecs.byName(this.opts.format || 'json');
        EventEmitter.call(this);
        this._connect();
    }

    async _connect() {
        this.$promise = PromiseA.try(async () => {
            if (!this.url) {
                throw new Error('AMQPFacet - `url` is required');
            }
            debug('Configuration for AMQPer using URL: ' + this.url);
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

            debug('connected');
            this.conn = conn;
            this.connected = true;
            conn.on('close', () => {
                this.connected = false;
                this.emit('close');
            });
            conn.on('error', (e) => {
                console.log(e);
                this.connected = false;
                this.emit('error');
            });
            this.conn = conn;
            let channel = await PromiseA.fromCallback(cb => this.conn.createChannel(cb));
            this.channel = channel;
            this.emit('connected');
            return;
        });

        return this.$promise;
    }

    bufferify(chunk, encoding) {
        return (typeof chunk === 'string') ? new Buffer(chunk, encoding || 'utf8') : chunk;
    }

    format(fmt) {
        this.opts.format = fmt;
        this.codec = codecs.byName(fmt || 'json');
    }

    publish(exchange, routingKey, content) {
        var that = this;
        return this.$promise.then(function () {
            var channel = that.channel;
            return PromiseA.try(function () {
                content = that.bufferify(that.codec.encode(content));
                return channel.publish(exchange, routingKey, content);
            });
        });
    }

    sendToQueue(queue, content) {
        var that = this;
        return this.$promise.then(function () {
            var channel = that.channel;
            return PromiseA.try(function () {
                content = that.bufferify(that.codec.encode(content));
                return channel.sendToQueue(queue, content);
            });
        });
    }

    route(route, options, handler) {
        if (typeof options === 'function') {
            handler = options;
            options = null;
        }

        if (handler && handler.length > 1) {
            deprecate('route handler signature changed from route(err, message) to route(message)');
        }

        function fn(message) {
            if (!handler) return;
            if (handler.length > 1) {
                handler(null, message);
            } else {
                handler(message);
            }
        }

        var that = this;
        return this.$promise.then(function () {
            var codec = that.codec;
            options = options || {};
            options.client = that;
            var router = new Router(route, options, function (message) {
                PromiseA.try(function () {
                    message.payload = codec.decode(message.content);
                    return fn(message);
                }).then(function () {
                    return message.ack();
                }).catch(function (err) {
                    debug('error', 'Error thrown in routing handler, not acking message. Error: ', err.stack);
                    that.emit('error', err);
                });
            });
            router.init();
            that.routers.push(router);
            return router.$promise;
        });

    }

    subscribe(route, options, handler) {
        return this.route(route, options, handler);
    }

    close() {
        if (this.closing || this.closed) {
            return PromiseA.resolve();
        }
        this.closing = true;
        let that = this;
        return close_connection(this.conn).then(function () {
            return PromiseA.all(PromiseA.map(that.routers, function (router) {
                return router.connection.then(function (conn) {
                    if (conn === that.conn) return;
                    return close_connection(conn);
                });
            }));
        }).then(function () {
            that.routers = [];
            that.closed = true;
            that.closing = false;
        });
    }
}

function close_connection(conn) {
    if (!conn || conn.closing || conn.closed) return PromiseA.resolve();
    conn.closing = true;
    return PromiseA.try(function () {
        return new PromiseA(function (resolve) {
            conn.once('close', function () {
                resolve();
                conn.closed = true;
                conn.closing = false;
            });
            conn.close();
        });
    }).catch(function (err) {
        console.error(err.stack);
    });
}

util.inherits(Client, EventEmitter);

module.exports = Client;
