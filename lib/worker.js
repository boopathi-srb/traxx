const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const mongoose = require("mongoose");
const traxxModel = require("./model");

module.exports = function startWorker(mongoUri, redisUri) {
  // Connect to MongoDB
  mongoose.connect(mongoUri);

  // Create a Redis connection
  const connection = new IORedis(redisUri,{
    maxRetriesPerRequest: null
  });

  // In-memory buffer to hold incoming jobs before bulk inserting
  let buffer = [];

  // Every 5 seconds, flush the buffer into the database
  setInterval(async () => {
    if (buffer.length === 0) return;

    // Grab all documents from the buffer
    const docsToInsert = buffer;

    try {
      // Bulk insert the documents into MongoDB
      await traxxModel.insertMany(docsToInsert);
      buffer=[];
    } catch (err) {
      console.error("[Worker] Bulk insert failed:", err);
    }
  }, 3000);

  // Create a new BullMQ worker to listen to the queue
  new Worker(
    "traxx-queue",
    async (job) => {
      buffer.push(job.data);
    },
    { connection }
  );
};
