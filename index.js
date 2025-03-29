const mongoose = require("mongoose");
const IORedis = require("ioredis");
const { Queue } = require("bullmq");
const startWorker = require("./worker");
const middleware = require("./lib/middleware");
const traxxModel = require("./lib/model");


async function init(mongoUri, redisUri) {
  await mongoose.connect(mongoUri);
  const redis = new IORedis(redisUri);
  new Queue("route-analytics-queue", { connection: redis });
  startWorker(mongoUri, redisUri)
  return {status:""};
}

module.exports = {
  init,
  middleware,
  traxxModel
};
