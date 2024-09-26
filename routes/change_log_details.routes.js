module.exports = app => {
  const change_logs_details = require("../controllers/change_log_details.controller.js");
  
  var router = require("express").Router();
  
  // Create a new 
  router.post("/", change_logs_details.create);
  
  // Retrieve all 
  // router.get("/", change_logs.findAll);

  // Retrieve a single  with id
  router.get("/:id", change_logs_details.findOne);
  
  // Update a  with id
  router.put("/:id", change_logs_details.update);
  
  // Delete a  with id
  router.delete("/:id", change_logs_details.delete);
  
  // Create a new 
  router.delete("/", change_logs_details.deleteAll);
  
  app.use("/change_logs_details", router);
};