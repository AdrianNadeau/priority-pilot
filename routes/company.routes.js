module.exports = app => {
  const companies = require("../controllers/company.controller.js");
  
  var router = require("express").Router();
  
  // Create a new Company
  router.post("/", companies.create);
    
  // Retrieve all Companies
  router.get("/", companies.findAll);

  // Retrieve a single Company with id
  router.get("/:id", companies.findOne);
    
  // Update a Company with id
  router.put("/:id", companies.update);
  
  // Delete a Company with id
  router.delete("/:id", companies.delete);
  
  // Create a new Company
  router.delete("/", companies.deleteAll);
  
  app.use("/companies", router);
};