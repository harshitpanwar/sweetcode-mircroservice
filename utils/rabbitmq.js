// rabbitmq.js
const amqp = require('amqplib');

async function connect() {
  try {
    const connection = await amqp.connect('amqps://panwarharshit2001:PanwarHarshit@123@b-49dfbd76-d3c4-442b-8272-b145d593a98a.mq.eu-north-1.amazonaws.com:5671');
    const channel = await connection.createChannel();
    return { connection, channel };
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
}

module.exports = connect;
