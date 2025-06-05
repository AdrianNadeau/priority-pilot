module.exports = (app) => {
  const tags = require("../controllers/tag.controller.js");
  const sessionMiddleware = require("../middleware/sessionMiddleware.js");

  var router = require("express").Router();

  // Create a new Tag
  router.post("/", sessionMiddleware, tags.create);

  // Retrieve all Companies
  router.get("/", sessionMiddleware, tags.findAll);

  // Retrieve a single Tag with id
  router.get("/:id", sessionMiddleware, tags.findOne);

  // Update a Tag with id
  router.put("/:id", sessionMiddleware, tags.update);

  // Update a Tag with id
  // router.put("/:id/:tag_name", tags.updateFromDefaultsPage);

  // Delete a Tag with id
  router.delete("/:id", sessionMiddleware, tags.delete);

  // Create a new Tag
  router.delete("/", sessionMiddleware, tags.deleteAll);

  app.use("/tags", router);
};
