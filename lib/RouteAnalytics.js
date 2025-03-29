const mongoose = require("mongoose");
const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const createModel = require("./model");
const middleware = require("./middleware");
const startWorker = require("./worker");
const dashboard = require("./dashboard");

class RouteAnalytics {
  constructor({ mongoUri, redisUri}) {
    this.mongoUri = mongoUri;
    this.redisUri = redisUri;
    this.queue = null;
    this.Model = null;
  }

  async init() {
    await mongoose.connect(this.mongoUri);
    const redisConnection = new IORedis(this.redisUri);
    this.queue = new Queue("route-analytics-queue", { connection: redisConnection });
    this.Model = createModel();
  }

  middleware() {
    return middleware(this.queue);
  }

  startWorker() {
    startWorker(this.mongoUri, this.redisUri);
  }

  dashboard() {
    return dashboard(this.Model);
  }
}

module.exports = RouteAnalytics;