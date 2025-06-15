/**
 * Test script to verify notification functionality
 *
 * Usage:
 * 1. Set environment variables for your webhook URLs
 *    export TEAMS_WEBHOOK_URL="https://your-teams-webhook-url"
 *    export SLACK_WEBHOOK_URL="https://your-slack-webhook-url"
 *    export GOOGLE_CHAT_WEBHOOK_URL="https://your-google-chat-webhook-url"
 *
 * 2. Run this script:
 *    node test-notifications.js
 */

const notifiers = require("../lib/notifications");

// Create a test error with stack trace
function generateTestError() {
  try {
    throw new Error("Test error message for notification");
  } catch (error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
}

// Sample request data
const testData = {
  route: "/api/users/123",
  method: "GET",
  statusCode: 500,
  latency: 345,
  timestamp: new Date(),
  requestBody: { userId: "123" },
  requestParams: { id: "123" },
  requestQuery: { includeDetails: "true" },
  error: generateTestError(),
};

async function testNotifications() {
  console.log("Testing notification channels...");

  // Test Teams notification
  if (process.env.TEAMS_WEBHOOK_URL) {
    try {
      console.log("Sending Teams notification...");
      await notifiers.teams.sendNotification(
        {
          webhookUrl: process.env.TEAMS_WEBHOOK_URL,
        },
        testData
      );
      console.log("✅ Teams notification sent successfully");
    } catch (error) {
      console.error("❌ Teams notification failed:", error.message);
    }
  } else {
    console.log("⚠️ Skipping Teams notification (TEAMS_WEBHOOK_URL not set)");
  }

  // Test Slack notification
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      console.log("Sending Slack notification...");
      await notifiers.slack.sendNotification(
        {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
        },
        testData
      );
      console.log("✅ Slack notification sent successfully");
    } catch (error) {
      console.error("❌ Slack notification failed:", error.message);
    }
  } else {
    console.log("⚠️ Skipping Slack notification (SLACK_WEBHOOK_URL not set)");
  }

  // Test Google Chat notification
  if (process.env.GOOGLE_CHAT_WEBHOOK_URL) {
    try {
      console.log("Sending Google Chat notification...");
      await notifiers.googleChat.sendNotification(
        {
          webhookUrl: process.env.GOOGLE_CHAT_WEBHOOK_URL,
        },
        testData
      );
      console.log("✅ Google Chat notification sent successfully");
    } catch (error) {
      console.error("❌ Google Chat notification failed:", error.message);
    }
  } else {
    console.log(
      "⚠️ Skipping Google Chat notification (GOOGLE_CHAT_WEBHOOK_URL not set)"
    );
  }
}

testNotifications().catch(console.error);
