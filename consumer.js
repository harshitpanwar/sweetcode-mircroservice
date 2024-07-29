require('dotenv').config();

const connect = require('./utils/rabbitmq');
const {executeCode} = require('./helpers/executeCode');

const RABBITMQ_QUEUE = process.env.RABBITMQ_QUEUE;

(async () => {
  const rabbit = await connect();
  const channel = rabbit.channel;
  const queue = RABBITMQ_QUEUE;

  await channel.assertQueue(queue, { durable: true });
  console.log(`Waiting for messages in ${queue}. To exit press CTRL+C`);

  //consume only one message at a time
  channel.prefetch(1);
  channel.consume(queue, async(msg) => {
    if (msg !== null) {

      const { language, code, problemId, id: submissionId } = JSON.parse(msg.content.toString());
      console.log('Received:', language, code, problemId, submissionId);

      const inputs = {
        language,
        code,
        problemId,
        submissionId
      };
      const answer = await executeCode(inputs);

      console.log('Result:', answer);
      channel.ack(msg);

    }
  });

  // channel.consume(queue, async(msg) => {
  //   if (msg !== null) {

  //     const { language, code, problemId, id: submissionId } = JSON.parse(msg.content.toString());
  //     console.log('Received:', language, code, problemId, submissionId);

  //     const inputs = {
  //       language,
  //       code,
  //       problemId,
  //       submissionId
  //     };
  //     const answer = await executeCode(inputs);

  //     console.log('Result:', answer);
  //     channel.ack(msg);

  //   }
  // });
})();
