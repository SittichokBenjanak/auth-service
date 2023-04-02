const amqp = require("amqp-connection-manager");

async function connectRabbitMQ() {
  const connection = amqp.connect(process.env.RABBITMQ_URL);
  connection.on("connect", function () {
    console.log("RabbitMQ Connected!");
  });
  connection.on("disconnect", function (err) {
    console.log("RabbitMQ Disconnected.", err.stack);
  });
  // Create a channel wrapper
  const channelWrapper = connection.createChannel({
    // json: true,
    setup: function (channel) {
      return channel;
    },
  });
  return channelWrapper;
}

module.exports = connectRabbitMQ;
