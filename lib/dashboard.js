const express = require("express");
const router = express.Router();

module.exports = function (Model) {
  router.get("/data", async (req, res) => {
    const data = await Model.find().sort({ timestamp: -1 }).limit(100);
    res.json(data);
  });

  return router;
};