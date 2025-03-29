const dayjs = require("dayjs");

module.exports = function (queue) {
  return (req, res, next) => {
    const start = process.hrtime();

    res.on("finish", () => {
      const diff = process.hrtime(start);
      const latency = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);

        const payload = {
          route: req.originalUrl.split("?")[0],
          method: req.method,
          latency,
          statusCode: res.statusCode,
          timestamp: dayjs().toDate(),
          requestBody: req.body || {},
          requestParams: req.params || {},
          requestQuery: req.query || {},
          // Assume that req.admin is set somewhere upstream, if needed.
          admin: req.admin || null,
          // Optionally capture error details if available.
          error: type === "failure" ? res.locals.error || null : null,
        };

        queue.add("track", payload);
      
    });

    next();
  };
};
