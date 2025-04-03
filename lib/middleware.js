const dayjs = require("dayjs");

module.exports = function (queue, customFields) {
  return (req, res, next) => {
    const start = process.hrtime();

    res.on("finish", async () => {
      const diff = process.hrtime(start);
      const latency = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
      let finalRoute = req.baseUrl;

      // If params are present, and route is defined (from Express router)
      if (req.params && Object.keys(req.params).length > 0) {
        // Reconstruct route by replacing actual values with :keys
        finalRoute = req.baseUrl + req.route.path;
      }

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
        ipAddress: req.ip, // Added IP address to the payload
      };

      queue.add("traxx-job", payload);
    });

    next();
  };
};
