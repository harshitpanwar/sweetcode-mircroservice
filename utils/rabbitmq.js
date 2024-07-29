// rabbitmq.js
const amqp = require('amqplib');
// read connection string from environment variables
const RABBITMQ_URL = process.env.RABBITMQ_URL;

async function connect() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    console.log('Connected to RabbitMQ');
    const channel = await connection.createChannel();
    return { connection, channel };
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
}

module.exports = connect;
