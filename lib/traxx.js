const mongoose = require("mongoose");
const IORedis = require("ioredis");
const { Queue } = require("bullmq");

const startWorker = require("./worker");
const middleware = require("./middleware");
const createModel = require("./model");

class Traxx {
  #mongoUri;
  #redisUri;
  #queue = null;
  #Model = null;
  #ready = false;
  #readyPromise;

  constructor({ mongoUri, redisUri }) {
    this.#mongoUri = mongoUri;
    this.#redisUri = redisUri;
  }

  async init() {
    this.#readyPromise = (async () => {
      await mongoose.connect(this.#mongoUri);
      const redis = new IORedis(this.#redisUri, { maxRetriesPerRequest: null });
      this.#queue = new Queue("route-analytics-queue", { connection: redis });
      this.#Model = createModel();
      startWorker(this.#mongoUri, this.#redisUri);
      this.#ready = true;
    })();
  }

  middleware() {
    // Always return middleware — it self-waits if needed
    return async (req, res, next) => {
      if (this.#readyPromise) {
        await this.#readyPromise;
      } else {
        console.warn("[Traxx] init() has not been called yet.");
        return next(); // fail silently
      }

      return middleware(this.#queue)(req, res, next);
    };
  }

  model() {
    return this.#Model;
  }
}

module.exports = Traxx;
