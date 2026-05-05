module.exports = (app) => {
  const changed_password_token = require("../controllers/changed_password_token.controller");

  var router = require("express").Router();
  // Define routes using controller functions
  router.post("/", changed_password_token.create);
  router.get("/", changed_password_token.findAll);
  router.get("/:id", changed_password_token.findOne);
  router.post("/:id", changed_password_token.update);
  router.delete("/:id", changed_password_token.delete);

  app.use("/changed_password_token", router);
};
