module.exports = (app) => {
  const phases = require("../controllers/phase.controller.js");

  var router = require("express").Router();

  // Create a new Tag
  router.post("/", phases.create);

  // Retrieve all Companies
  router.get("/", phases.findAll);

  // Retrieve a single Tag with id
  router.get("/:id", phases.findOne);

  // Update a Tag with id
  router.put("/:id", phases.update);

  // Delete a Tag with id
  router.delete("/:id", phases.delete);

  // Create a new Tag
  router.delete("/", phases.deleteAll);

  app.use("/phases", router);
};
