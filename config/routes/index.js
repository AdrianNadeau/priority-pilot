const express = require("express");
const router = express.Router();
const controller = require("../controllers/file.controller.js");

const routes = (app) => {
  router.post("/register", controller.create);
  router.get("/files", controller.getListFiles);
  router.get("/files/:name", controller.download);
  router.delete("/files/:name", controller.remove);

  app.use(router);
};

module.exports = routes;
