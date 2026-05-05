module.exports = (app) => {
  const statuses = require("../controllers/statuses.controller.js");
  const sessionMiddleware = require("../middleware/sessionMiddleware.js");

  var router = require("express").Router();

  // Create a new Tag
  router.post("/", sessionMiddleware, statuses.create);

  // Retrieve all Companies
  router.get("/", sessionMiddleware, statuses.findAll);

  // Retrieve a single Tag with id
  router.get(
    "/projects/:project_id_fk",
    sessionMiddleware,
    statuses.findAllByProjectId,
  );

  // Retrieve a single Tag with id
  router.get("/:id", sessionMiddleware, statuses.findOne);

  // Update a Tag with id
  router.put("/:id", sessionMiddleware, statuses.update);

  // Delete a Tag with id
  router.delete("/:id", sessionMiddleware, statuses.delete);

  // Create a new Tag
  router.delete("/", sessionMiddleware, statuses.deleteAll);

  app.use("/statuses", router);
};
