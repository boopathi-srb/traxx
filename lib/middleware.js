const dayjs = require("dayjs");

module.exports = function (queue, customFields, logIPAddress) {
  return (req, res, next) => {
    const start = process.hrtime();

    // Store original error handling methods
    const originalNext = next;
    let errorCaptured = null;

    // Override next to capture errors
    const wrappedNext = (err) => {
      if (err) {
        errorCaptured = {
          message: err.message || "Unknown error",
          stack: err.stack || null,
        };
      }
      return originalNext(err);
    };

    // Capture the original res.json and res.send methods to track response body
    const originalJson = res.json;
    const originalSend = res.send;
    let responseBody = {};

    // Override res.json to capture response body
    res.json = function (body) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Override res.send to capture response body
    res.send = function (body) {
      if (typeof body === "object" && body !== null) {
        responseBody = body;
      } else if (
        typeof body === "string" &&
        body.startsWith("{") &&
        body.endsWith("}")
      ) {
        try {
          responseBody = JSON.parse(body);
        } catch (e) {
          // If it's not valid JSON, store as string
          responseBody = { data: body };
        }
      } else {
        responseBody = { data: body };
      }
      return originalSend.call(this, body);
    };

    res.on("finish", async () => {
      try {
        const diff = process.hrtime(start);
        const latency = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
        let finalRoute = req.baseUrl + (req?.route?.path ?? "");
        if (finalRoute.endsWith("/")) {
          finalRoute = finalRoute.slice(0, -1);
        }

        const ipAddress =
          req.headers["x-forwarded-for"] ||
          req.connection.remoteAddress ||
          req.ip;
        const normalizedIp = ipAddress.includes("::ffff:")
          ? ipAddress.split("::ffff:")[1]
          : ipAddress;

        const payload = {
          route: finalRoute,
          method: req.method,
          latency,
          customFields,
          statusCode: res.statusCode,
          timestamp: dayjs().toDate(),
          requestBody: req.body || {},
          requestParams: req.params || {},
          requestQuery: req.query || {},
          responseBody: responseBody || {},
          ...(logIPAddress ? { ipAddress: normalizedIp } : {}),
        };

        // Add error information if available
        if (errorCaptured) {
          payload.error = errorCaptured;
        } else if (res.statusCode >= 400) {
          // For status codes indicating errors, add a generic error object
          payload.error = {
            message: `HTTP ${res.statusCode}: ${
              res.statusMessage || getDefaultStatusMessage(res.statusCode)
            }`,
            stack: null,
          };
        }

        await queue.add("traxx-job", payload);
      } catch (error) {
        console.error("[Middleware] Error processing request:", error);
      }
    });

    next = wrappedNext;
    next();
  };
};

// Helper function to get default status messages
function getDefaultStatusMessage(statusCode) {
  const statusMessages = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    413: "Payload Too Large",
    414: "URI Too Long",
    415: "Unsupported Media Type",
    429: "Too Many Requests",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };

  return statusMessages[statusCode] || "Unknown Error";
}
