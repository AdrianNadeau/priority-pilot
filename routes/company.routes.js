module.exports = (app) => {
  const companies = require("../controllers/company.controller.js");
  // const sessionMiddleware = require("../middleware/sessionMiddleware.js");

  var router = require("express").Router();

  // Create a new Company
  router.post("/", companies.create);

  // Retrieve all Companies
  router.get("/", companies.findAll);
  // Retrieve all Companies
  router.get("/get/defaults", companies.findDefaults);

  // Retrieve all Companies
  router.post("/set/defaults", companies.setDefaults);

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
