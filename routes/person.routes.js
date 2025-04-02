module.exports = (app) => {
  const persons = require("../controllers/person.controller.js");
  const jwt = require("jsonwebtoken");
  const sessionMiddleware = require("../middleware/sessionMiddleware.js");
  const checkProjectReadonly = require("../middleware/readOnlyProject");
  const companyPortfolioName = require("../middleware/companyPortfolioName.js");

  var router = require("express").Router();
  // Define routes using controller functions
  router.post("/", companyPortfolioName, persons.create);
  // Route to send welcome emailAuthrouter.post("/register", companies.create);
  router.post("/send-reset-email", persons.sendResetPasswordEmail);

  // Create a new Person
  router.post("/", sessionMiddleware, companyPortfolioName, persons.create);

  // Retrieve all
  router.get("/", sessionMiddleware, companyPortfolioName, persons.findAll);

  // Retrieve a single Person with id
  router.get("/:id", sessionMiddleware, companyPortfolioName, persons.findOne);

  // Retrieve a single Person with id
  router.get(
    "/edit/:id",
    sessionMiddleware,
    companyPortfolioName,
    persons.findOneForEdit,
  );
  router.get(
    "/statusprojects/:id",
    sessionMiddleware,
    companyPortfolioName,
    persons.findOneForEdit,
  );

  // Retrieve a single Person with id
  router.post("/auth/login/", persons.login);

  // Update a Person with id
  router.post("/:id", sessionMiddleware, companyPortfolioName, persons.update);

  // Delete a Person with id
  router.post(
    "/delete/:id",
    sessionMiddleware,
    companyPortfolioName,
    persons.delete,
  );

  // Create a new Person
  router.delete(
    "/",
    sessionMiddleware,
    companyPortfolioName,
    persons.deleteAll,
  );
  router.get("/setCheckPassword/:token");
  // persons.setChangePassword,
  app.use("/persons", router);
};
