const mongoose = require("mongoose");
const IORedis = require("ioredis");
const { Queue } = require("bullmq");

const startWorker = require("./worker");
const middleware = require("./middleware");
const traxxModel = require("./model");
const NotificationManager = require("./notifications/manager");

class Traxx {
  #mongoUri;
  #redisUri;
  #logIPAddress = false;
  #queue = null;
  #readyPromise;
  #notificationManager = null;

  constructor({
    mongoUri,
    redisUri,
    logIPAddress = false,
    notifications = null,
  }) {
    this.#mongoUri = mongoUri;
    this.#redisUri = redisUri;
    this.#logIPAddress = logIPAddress;

    if (notifications) {
      this.#notificationManager = new NotificationManager(notifications);
    }
  }

  async init() {
    this.#readyPromise = (async () => {
      await mongoose.connect(this.#mongoUri);
      const redis = new IORedis(this.#redisUri, { maxRetriesPerRequest: null });
      this.#queue = new Queue("traxx-queue", { connection: redis });
      startWorker(this.#mongoUri, this.#redisUri, this.#notificationManager);
    })();
  }

  middleware(customFields) {
    // Always return middleware — it self-waits if needed
    return async (req, res, next) => {
      if (this.#readyPromise) {
        await this.#readyPromise;
      } else {
        console.warn("[Traxx] init() has not been called yet.");
        return next(); // fail silently
      }

      return middleware(this.#queue, customFields, this.#logIPAddress)(
        req,
        res,
        next
      );
    };
  }

  model() {
    return traxxModel;
  }
}

module.exports = Traxx;
