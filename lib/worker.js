const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const mongoose = require("mongoose");
const createModel = require("./model");

module.exports = function startWorker(mongoUri, redisUri) {
  // Connect to MongoDB
  mongoose.connect(mongoUri);
  const RouteAnalytics = createModel();

  // Create a Redis connection
  const connection = new IORedis(redisUri);

  // In-memory buffer to hold incoming jobs before bulk inserting
  const buffer = [];

  // Every 5 seconds, flush the buffer into the database
  setInterval(async () => {
    if (buffer.length === 0) return;

    // Grab all documents from the buffer
    const docsToInsert = buffer;

    try {
      // Bulk insert the documents into MongoDB
      await RouteAnalytics.insertMany(docsToInsert);
      // Optionally log success:
      // console.log(`Inserted ${docsToInsert.length} analytics documents`);
    } catch (err) {
      console.error("[Worker] Bulk insert failed:", err);
      // Optionally, handle failed inserts (e.g., push docs back to buffer)
    }
  }, 3000);

  // Create a new BullMQ worker to listen to the queue
  new Worker(
    "route-analytics-queue",
    async (job) => {
      // Expect job.data to contain everything you need,
      // including admin, route, method, timestamp, statusCode, error, requestBody, etc.
      buffer.push(job.data);
    },
    { connection }
  );
};
