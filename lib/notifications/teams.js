const https = require("https");

/**
 * Send a notification to Microsoft Teams
 * @param {Object} options - Notification options
 * @param {string} options.webhookUrl - Teams webhook URL
 * @param {Object} data - Request data that triggered the notification
 * @returns {Promise<void>}
 */
async function sendNotification(options, data) {
  if (!options.webhookUrl) {
    throw new Error("Teams webhook URL is required");
  }

  const { route, method, statusCode, latency, timestamp, error } = data;

  const facts = [
    {
      name: "Status Code",
      value: statusCode.toString(),
    },
    {
      name: "Method",
      value: method,
    },
    {
      name: "Route",
      value: route,
    },
    {
      name: "Latency",
      value: `${latency}ms`,
    },
    {
      name: "Timestamp",
      value: new Date(timestamp).toISOString(),
    },
  ];

  // Add error information if available
  if (error && error.message) {
    facts.push({
      name: "Error",
      value: error.message,
    });
  }

  const payload = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: statusCode >= 400 ? "FF0000" : "0078D7",
    summary: `${method} ${route} returned ${statusCode}`,
    sections: [
      {
        activityTitle: `${method} ${route} returned ${statusCode}`,
        facts: facts,
      },
    ],
  };

  // Add error stack as a separate section if available
  if (error && error.stack) {
    payload.sections.push({
      title: "Error Stack",
      text: "```\n" + error.stack + "\n```",
    });
  }

  return new Promise((resolve, reject) => {
    const url = new URL(options.webhookUrl);

    const requestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(
            new Error(`Teams notification failed: ${res.statusCode} ${data}`)
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

module.exports = { sendNotification };
