module.exports = app => {
  const change_reason = require("../controllers/change_reason.controller.js");
  
  var router = require("express").Router();
  
  // Create a new 
  router.post("/", change_reason.create);
  
  // Retrieve all 
  router.get("/", change_reason.findAll);

  // Retrieve a single  with id
  router.get("/:id", change_reason.findOne);
    
  // Update a  with id
  router.put("/:id", change_reason.update);
  
  // Delete a  with id
  router.delete("/:id", change_reason.delete);
  
  // Create a new 
  router.delete("/", change_reason.deleteAll);
  
  app.use("/change_reason", router);
};