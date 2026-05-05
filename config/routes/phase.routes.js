module.exports = (app) => {
  const phases = require("../controllers/phase.controller.js");
  const sessionMiddleware = require("../middleware/sessionMiddleware.js");

  var router = require("express").Router();

  // Create a new Tag
  router.post("/", sessionMiddleware, phases.create);

  // Retrieve all Companies
  router.get("/", sessionMiddleware, phases.findAll);

  // Retrieve a single Tag with id
  router.get("/:id", sessionMiddleware, phases.findOne);

  // Update a Tag with id
  router.put("/:id", sessionMiddleware, phases.update);

  // Delete a Tag with id
  router.delete("/:id", sessionMiddleware, phases.delete);

  // Create a new Tag
  router.delete("/", sessionMiddleware, phases.deleteAll);

  app.use("/phases", router);
};
