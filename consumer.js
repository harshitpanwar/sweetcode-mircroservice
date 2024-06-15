// consumer.js
const connect = require('./utils/rabbitmq');

(async () => {
  const rabbit = await connect();
  const channel = rabbit.channel;
  const queue = 'Code Executer';

  await channel.assertQueue(queue, { durable: true });
  console.log(`Waiting for messages in ${queue}. To exit press CTRL+C`);

  channel.consume(queue, (msg) => {
    if (msg !== null) {
      console.log('Received:', msg.content.toString());
      channel.ack(msg);
    }
  });
})();
