module.exports = (app) => {
  const tags = require("../controllers/tag.controller.js");

  var router = require("express").Router();

  // Create a new Tag
  router.post("/", tags.create);

  // Retrieve all Companies
  router.get("/", tags.findAll);

  // Retrieve a single Tag with id
  router.get("/:id", tags.findOne);

  // Update a Tag with id
  router.put("/:id", tags.update);

  // Update a Tag with id
  router.put("/:id/:tag_name", tags.updateFromDefaultsPage);

  // Delete a Tag with id
  router.delete("/:id", tags.delete);

  // Create a new Tag
  router.delete("/", tags.deleteAll);

  app.use("/tags", router);
};
