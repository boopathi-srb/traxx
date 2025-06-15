const https = require("https");

/**
 * Send a notification to Google Chat
 * @param {Object} options - Notification options
 * @param {string} options.webhookUrl - Google Chat webhook URL
 * @param {Object} data - Request data that triggered the notification
 * @returns {Promise<void>}
 */
async function sendNotification(options, data) {
  if (!options.webhookUrl) {
    throw new Error("Google Chat webhook URL is required");
  }

  const { route, method, statusCode, latency, timestamp, error } = data;

  const widgets = [
    {
      keyValue: {
        topLabel: "Status Code",
        content: statusCode.toString(),
      },
    },
    {
      keyValue: {
        topLabel: "Method",
        content: method,
      },
    },
    {
      keyValue: {
        topLabel: "Route",
        content: route,
      },
    },
    {
      keyValue: {
        topLabel: "Latency",
        content: `${latency}ms`,
      },
    },
    {
      keyValue: {
        topLabel: "Timestamp",
        content: new Date(timestamp).toISOString(),
      },
    },
  ];

  // Add error information if available
  if (error && error.message) {
    widgets.push({
      keyValue: {
        topLabel: "Error",
        content: error.message,
      },
    });
  }

  const sections = [
    {
      widgets: widgets,
    },
  ];

  // Add error stack as a separate section if available
  if (error && error.stack) {
    sections.push({
      widgets: [
        {
          textParagraph: {
            text: "<b>Error Stack:</b>",
          },
        },
        {
          textParagraph: {
            text: `<pre>${error.stack}</pre>`,
          },
        },
      ],
    });
  }

  const payload = {
    cards: [
      {
        header: {
          title: `API Request Alert: ${statusCode} Status Code`,
          subtitle: `${method} ${route}`,
          imageStyle: "IMAGE",
        },
        sections: sections,
      },
    ],
  };

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
            new Error(
              `Google Chat notification failed: ${res.statusCode} ${data}`
            )
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
