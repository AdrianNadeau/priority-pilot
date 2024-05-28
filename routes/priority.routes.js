module.exports = app => {
    const priorities = require("../controllers/priority.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Priority
    router.post("/", priorities.create);
  
    // Retrieve all Companies
    router.get("/", priorities.findAll);

    // Retrieve a single Priority with id
    router.get("/:id", priorities.findOne);
  
    // Update a Priority with id
    router.put("/:id", priorities.update);
  
    // Delete a Priority with id
    router.delete("/:id", priorities.delete);
  
    // Create a new Priority
    router.delete("/", priorities.deleteAll);
  
    app.use('/priorities', router);
  };