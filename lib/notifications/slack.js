const https = require("https");

/**
 * Send a notification to Slack
 * @param {Object} options - Notification options
 * @param {string} options.webhookUrl - Slack webhook URL
 * @param {Object} data - Request data that triggered the notification
 * @returns {Promise<void>}
 */
async function sendNotification(options, data) {
  if (!options.webhookUrl) {
    throw new Error("Slack webhook URL is required");
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

  const color = statusCode >= 400 ? "#FF0000" : "#36a64f";

  const fields = [
    {
      title: "Status Code",
      value: statusCode.toString(),
      short: true,
    },
    {
      title: "Method",
      value: method,
      short: true,
    },
    {
      title: "Route",
      value: route,
      short: true,
    },
    {
      title: "Latency",
      value: `${latency}ms`,
      short: true,
    },
    {
      title: "Timestamp",
      value: new Date(timestamp).toISOString(),
      short: false,
    },
  ];

  // Add IP address if available
  if (ipAddress) {
    fields.push({
      title: "IP Address",
      value: ipAddress,
      short: true,
    });
  }

  // Add error information if available
  if (error && error.message) {
    fields.push({
      title: "Error",
      value: error.message,
      short: false,
    });
  }

  const payload = {
    attachments: [
      {
        color,
        pretext: `Traxx Monitoring Alert: ${statusCode} Status Code`,
        title: `${method} ${route}`,
        fields: fields,
        footer: "Traxx Monitoring",
      },
    ],
  };

  // Add error stack as a separate attachment if available
  if (error && error.stack) {
    payload.attachments.push({
      color,
      title: "Error Stack",
      text: "```\n" + error.stack + "\n```",
      footer: "Traxx Monitoring",
    });
  }

  // Add custom fields if available
  if (customFields && Object.keys(customFields).length > 0) {
    payload.attachments.push({
      color,
      title: "Custom Fields",
      text: "```\n" + JSON.stringify(customFields, null, 2) + "\n```",
      footer: "Traxx Monitoring",
    });
  }

  // Add request data
  if (requestParams && Object.keys(requestParams).length > 0) {
    payload.attachments.push({
      color,
      title: "Request Parameters",
      text: "```\n" + JSON.stringify(requestParams, null, 2) + "\n```",
      footer: "Traxx Monitoring",
    });
  }

  if (requestQuery && Object.keys(requestQuery).length > 0) {
    payload.attachments.push({
      color,
      title: "Request Query",
      text: "```\n" + JSON.stringify(requestQuery, null, 2) + "\n```",
      footer: "Traxx Monitoring",
    });
  }

  if (requestBody && Object.keys(requestBody).length > 0) {
    payload.attachments.push({
      color,
      title: "Request Body",
      text: "```\n" + JSON.stringify(requestBody, null, 2) + "\n```",
      footer: "Traxx Monitoring",
    });
  }

  if (responseBody && Object.keys(responseBody).length > 0) {
    payload.attachments.push({
      color,
      title: "Response Body",
      text: "```\n" + JSON.stringify(responseBody, null, 2) + "\n```",
      footer: "Traxx Monitoring",
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
            new Error(`Slack notification failed: ${res.statusCode} ${data}`)
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
