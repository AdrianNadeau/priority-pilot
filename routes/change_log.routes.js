module.exports = app => {
  const change_logs = require("../controllers/change_log.controller.js");
  
  var router = require("express").Router();
  
  // Create a new 
  router.post("/", change_logs.create);
  
  // Retrieve all 
  router.get("/", change_logs.findAll);

  // Retrieve all  /change_logs/project/308
  router.get("/project/:id", change_logs.findAllByProject);

  

  // Retrieve a single  with id
  router.get("/:id", change_logs.findOne);
    
  // Update a  with id
  router.put("/:id", change_logs.update);
  
  // Delete a  with id
  router.delete("/:id", change_logs.delete);
  
  // Create a new 
  router.delete("/", change_logs.deleteAll);
  
  app.use("/change_logs", router);
};