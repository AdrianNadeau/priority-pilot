module.exports = (app) => {
  const priorities = require("../controllers/priority.controller.js");
  const sessionMiddleware = require("../middleware/sessionMiddleware.js");

  var router = require("express").Router();

  // Create a new Priority
  router.post("/", sessionMiddleware, priorities.create);

  // Retrieve all Companies
  router.get("/", sessionMiddleware, priorities.findAll);

  // Retrieve a single Priority with id
  router.get("/:id", sessionMiddleware, priorities.findOne);

  // Update a Priority with id
  router.post("/:id", sessionMiddleware, priorities.update);

  // Delete a Priority with id
  router.delete("/:id", sessionMiddleware, priorities.delete);

  // Create a new Priority
  router.delete("/", sessionMiddleware, priorities.deleteAll);

  app.use("/priorities", router);
};
