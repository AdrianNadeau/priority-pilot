module.exports = app => {
  const statuses = require("../controllers/statuses.controller.js");
  
  var router = require("express").Router();
  
  // Create a new Tag
  router.post("/", statuses.create);
  
  // Retrieve all Companies
  router.get("/", statuses.findAll);

  // Retrieve a single Tag with id
  router.get("/:id", statuses.findOne);
  
  // Update a Tag with id
  router.put("/:id", statuses.update);
  
  // Delete a Tag with id
  router.delete("/:id", statuses.delete);
  
  // Create a new Tag
  router.delete("/", statuses.deleteAll);
  
  app.use("/statuses", router);
};