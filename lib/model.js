const mongoose = require('mongoose');

const traxxSchema = new mongoose.Schema(
  {
    method: { type: String },
    route: { type: String },
    statusCode: { type: Number },
    latency: { type: Number },
    requestBody: { type: Object, default: {} },
    requestParams: { type: Object, default: {} },
    requestQuery: { type: Object, default: {} },
    responseBody: { type: Object, default: {} },
    error: {
      message: { type: String, default: null },
      stack: { type: String, default: null }
    }
  },
  {
    collection: "traxx",
    timestamps: true
  }
);

module.exports = mongoose.models.Traxx || mongoose.model("Traxx", traxxSchema);
