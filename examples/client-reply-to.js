const amqp = require('amqplib/callback_api');
const uuid = require('uuid/v1');
const codecs = require('../src/codecs');
const codec = codecs.byName('json');

const args = process.argv;

amqp.connect('amqp://nevem:nevem@localhost/order', function(err, conn) {
    conn.createChannel(function(err, ch) {
        ch.assertQueue('', {durable: true, autoDelete: false, messageTtl: 2000, expires: 3600000}, function(err, q) {
            const id = uuid();
            const body = codec.encode({id, methodName: 'sync', args, jsonrpc: '2.0'});
            const content = (typeof body === 'string') ? new Buffer(body, 'utf8') : body;


            ch.consume(q.queue, function(msg) {
                console.log('Got %s', msg.content.toString());
            }, {noAck: true});
            ch.sendToQueue('rabbit:service:test1:queue',
                content,
                { correlationId: id, replyTo: q.queue });
        });
    });
});