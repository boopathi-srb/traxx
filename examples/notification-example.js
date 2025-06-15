const express = require("express");
const Traxx = require("traxx");

// Create Express app
const app = express();
app.use(express.json());

// Initialize Traxx with notification configuration
const traxx = new Traxx({
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/traxx-example",
  redisUri: process.env.REDIS_URI || "redis://localhost:6379",
  logIPAddress: true,
  notifications: {
    // Send notifications for all 4xx and 5xx status codes
    statusCodes: { min: 400, max: 599 },
    channels: [
      // Microsoft Teams notification
      {
        type: "teams",
        options: {
          webhookUrl: process.env.TEAMS_WEBHOOK_URL,
        },
      },
      // Slack notification
      {
        type: "slack",
        options: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
        },
      },
      // Google Chat notification
      {
        type: "googleChat",
        options: {
          webhookUrl: process.env.GOOGLE_CHAT_WEBHOOK_URL,
        },
      },
    ],
  },
});

// Apply Traxx middleware to all routes
app.use(traxx.middleware({ service: "notification-example" }));

// Example routes
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "Hello World! This is a successful request." });
});

app.get("/not-found", (req, res) => {
  res.status(404).json({ error: "Resource not found" });
});

app.get("/server-error", (req, res) => {
  res.status(500).json({ error: "Internal server error" });
});

// This will trigger an error with stack trace
app.get("/throw-error", (req, res, next) => {
  try {
    // Simulate a complex error
    const user = undefined;
    const result = user.profile.getData(); // This will throw an error
    res.json(result);
  } catch (err) {
    next(err); // Pass error to Express error handler
  }
});

// This will trigger an async error
app.get("/async-error", async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Async operation failed"));
      }, 100);
    });
    res.json({ success: true });
  } catch (err) {
    next(err); // Pass error to Express error handler
  }
});

// Custom error with additional details
app.get("/custom-error", (req, res, next) => {
  const error = new Error("Custom application error");
  error.code = "CUSTOM_ERROR_CODE";
  error.details = {
    reason: "Something went wrong",
    userId: req.query.userId || "unknown",
  };
  next(error);
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: err.message,
    code: err.code || "INTERNAL_ERROR",
    details: err.details || {},
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await traxx.init();
  console.log(`Server running on port ${PORT}`);
  console.log("Try these endpoints:");
  console.log("  - GET /                 (200 OK)");
  console.log("  - GET /not-found        (404 Not Found)");
  console.log("  - GET /server-error     (500 Server Error)");
  console.log("  - GET /throw-error      (500 Error with Stack Trace)");
  console.log("  - GET /async-error      (500 Async Error)");
  console.log("  - GET /custom-error     (500 Custom Error with Details)");
});
