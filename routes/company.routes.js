module.exports = (app) => {
  const companies = require("../controllers/company.controller.js");
  const sessionMiddleware = require("../middleware/sessionMiddleware.js");

  var router = require("express").Router();

  // Create a new Company
  router.post("/", sessionMiddleware, companies.create);

  // Retrieve all Companies
  router.get("/", sessionMiddleware, companies.findAll);
  // Retrieve all Companies
  router.get("/get/defaults", sessionMiddleware, companies.findDefaults);

  // Retrieve all Companies
  router.post("/set/defaults", sessionMiddleware, companies.setDefaults);

  // Retrieve a single Company with id
  router.get("/:id", sessionMiddleware, companies.findOne);

  // Update a Company with id
  router.put("/:id", sessionMiddleware, companies.update);

  // Delete a Company with id
  router.delete("/:id", sessionMiddleware, companies.delete);

  // Create a new Company
  router.delete("/", sessionMiddleware, companies.deleteAll);

  app.use("/companies", router);
};
