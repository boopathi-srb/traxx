const https = require("https");
const dayjs = require("dayjs");

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

  // Format timestamp
  const formattedTimestamp = dayjs(timestamp).format("DD-MM-YYYY, HH:mm:ss");

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
      value: formattedTimestamp,
    },
  ];

  // Add IP address if available
  if (ipAddress) {
    facts.push({
      name: "IP Address",
      value: ipAddress,
    });
  }

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
    summary: `Traxx Monitoring: ${method} ${route} returned ${statusCode}`,
    sections: [
      {
        activityTitle: `Traxx Monitoring Alert: ${method} ${route} returned ${statusCode}`,
        activitySubtitle: "Powered by Traxx Monitoring",
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

  // Add custom fields section if available
  if (customFields && Object.keys(customFields).length > 0) {
    payload.sections.push({
      title: "Custom Fields",
      text: "```\n" + JSON.stringify(customFields, null, 2) + "\n```",
    });
  }

  // Add request data sections
  const requestSections = [];

  if (requestParams && Object.keys(requestParams).length > 0) {
    requestSections.push({
      title: "Request Parameters",
      text: "```\n" + JSON.stringify(requestParams, null, 2) + "\n```",
    });
  }

  if (requestQuery && Object.keys(requestQuery).length > 0) {
    requestSections.push({
      title: "Request Query",
      text: "```\n" + JSON.stringify(requestQuery, null, 2) + "\n```",
    });
  }

  if (requestBody && Object.keys(requestBody).length > 0) {
    requestSections.push({
      title: "Request Body",
      text: "```\n" + JSON.stringify(requestBody, null, 2) + "\n```",
    });
  }

  if (responseBody && Object.keys(responseBody).length > 0) {
    requestSections.push({
      title: "Response Body",
      text: "```\n" + JSON.stringify(responseBody, null, 2) + "\n```",
    });
  }

  // Add request data sections to payload
  payload.sections = [...payload.sections, ...requestSections];

  // Add footer section with Traxx branding
  payload.sections.push({
    text: "Traxx Monitoring - Route Analytics for Express.js",
  });

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
