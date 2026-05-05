var express = require("express");
require("dotenv").config();
var DashboardRouter = express.Router();

// Dashboard
DashboardRouter.get("/", async function (req, res) {
  res.render("/control");
});

module.exports = DashboardRouter;
