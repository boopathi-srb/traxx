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

  const {
    route,
    method,
    statusCode,
    latency,
    timestamp,
    error,
    requestBody,
    requestParams,
    requestQuery,
    responseBody,
    customFields,
    ipAddress,
  } = data;

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

  // Add IP address if available
  if (ipAddress) {
    widgets.push({
      keyValue: {
        topLabel: "IP Address",
        content: ipAddress,
      },
    });
  }

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

  // Add custom fields if available
  if (customFields && Object.keys(customFields).length > 0) {
    sections.push({
      widgets: [
        {
          textParagraph: {
            text: "<b>Custom Fields:</b>",
          },
        },
        {
          textParagraph: {
            text: `<pre>${JSON.stringify(customFields, null, 2)}</pre>`,
          },
        },
      ],
    });
  }

  // Add request parameters if available
  if (requestParams && Object.keys(requestParams).length > 0) {
    sections.push({
      widgets: [
        {
          textParagraph: {
            text: "<b>Request Parameters:</b>",
          },
        },
        {
          textParagraph: {
            text: `<pre>${JSON.stringify(requestParams, null, 2)}</pre>`,
          },
        },
      ],
    });
  }

  // Add request query if available
  if (requestQuery && Object.keys(requestQuery).length > 0) {
    sections.push({
      widgets: [
        {
          textParagraph: {
            text: "<b>Request Query:</b>",
          },
        },
        {
          textParagraph: {
            text: `<pre>${JSON.stringify(requestQuery, null, 2)}</pre>`,
          },
        },
      ],
    });
  }

  // Add request body if available
  if (requestBody && Object.keys(requestBody).length > 0) {
    sections.push({
      widgets: [
        {
          textParagraph: {
            text: "<b>Request Body:</b>",
          },
        },
        {
          textParagraph: {
            text: `<pre>${JSON.stringify(requestBody, null, 2)}</pre>`,
          },
        },
      ],
    });
  }

  // Add response body if available
  if (responseBody && Object.keys(responseBody).length > 0) {
    sections.push({
      widgets: [
        {
          textParagraph: {
            text: "<b>Response Body:</b>",
          },
        },
        {
          textParagraph: {
            text: `<pre>${JSON.stringify(responseBody, null, 2)}</pre>`,
          },
        },
      ],
    });
  }

  // Add footer with Traxx branding
  sections.push({
    widgets: [
      {
        textParagraph: {
          text: "<i>Traxx Monitoring - Route Analytics for Express.js</i>",
        },
      },
    ],
  });

  const payload = {
    cards: [
      {
        header: {
          title: `Traxx Monitoring Alert: ${statusCode} Status Code`,
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
