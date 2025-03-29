module.exports = function (queue) {
    return (err, req, res, next) => {
        queue.add("track", {
          route: req.originalUrl.split("?")[0],
          method: req.method,
          type: "failure",
          latency: 0,
          timestamp: new Date(),
        });
      res.status(500).json({ message: "Internal Server Error" });
    };
  };