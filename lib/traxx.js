const mongoose = require("mongoose");
const IORedis = require("ioredis");
const { Queue } = require("bullmq");

const startWorker = require("./worker");
const middleware = require("./middleware");
const createModel = require("./model");

class Traxx {
  #mongoUri;
  #redisUri;
  #queue;
  #Model;

  constructor({ mongoUri, redisUri }) {
    this.#mongoUri = mongoUri;
    this.#redisUri = redisUri;
  }

  async init() {
    await mongoose.connect(this.#mongoUri);
    const redis = new IORedis(this.#redisUri);
    this.#queue = new Queue("route-analytics-queue", { connection: redis });
    this.#Model = createModel();
    startWorker(this.#mongoUri, this.#redisUri);
  }

  middleware() {
    return middleware(this.#queue);
  }

  model() {
    return this.#Model;
  }
}

module.exports = Traxx;