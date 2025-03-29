// lib/model.js
const mongoose = require('mongoose');

const routeAnalyticsSchema = new mongoose.Schema(
  {
    method: { type: String },
    route: { type: String },
    statusCode: { type: Number },
    latencyMs: { type: Number },
    requestBody: { type: Object, default: {} },
    requestParams: { type: Object, default: {} },
    requestQuery: { type: Object, default: {} },
    responseBody: { type: Object, default: {} },
    // NEW: For capturing error details (if any)
    error: { 
      message: { type: String, default: null },
      stack: { type: String, default: null }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RouteAnalytics', routeAnalyticsSchema);
