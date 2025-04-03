const dayjs = require("dayjs");

module.exports = function (queue, customFields, logIPAddress) {
  return (req, res, next) => {
    const start = process.hrtime();

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
          ...(logIPAddress ? { ipAddress: normalizedIp } : {}),
        };

        await queue.add("traxx-job", payload);
      } catch (error) {
        console.error("[Middleware] Error processing request:", error);
      }
    });

    next();
  };
};
