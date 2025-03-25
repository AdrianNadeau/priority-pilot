module.exports = (app) => {
  const persons = require("../controllers/person.controller.js");
  const jwt = require("jsonwebtoken");

  var router = require("express").Router();

  // Route to send welcome emailAuthrouter.post("/register", companies.create);
  // router.post("/send-reset-email", persons.sendResetPasswordEmail);

  // Create a new Person
  router.post("/", persons.create);

  // Retrieve all
  router.get("/", persons.findAll);

  // Retrieve a single Person with id
  router.get("/:id", persons.findOne);

  // Retrieve a single Person with id
  router.get("/edit/:id", persons.findOneForEdit);
  router.get("/statusprojects/:id", persons.findOneForEdit);

  // Retrieve a single Person with id
  router.post("/auth/login/", persons.login);

  // Update a Person with id
  router.post("/:id", persons.update);

  // Delete a Person with id
  router.post("/delete/:id", persons.delete);

  // Create a new Person
  router.delete("/", persons.deleteAll);

  app.use("/persons", router);
};
