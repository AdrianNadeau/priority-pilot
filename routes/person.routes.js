module.exports = (app) => {
  const persons = require("../controllers/person.controller.js");
  const jwt = require("jsonwebtoken");
  const sessionMiddleware = require("../middleware/sessionMiddleware.js");
  const checkProjectReadonly = require("../middleware/readOnlyProject");
  const companyPortfolioName = require("../middleware/companyPortfolioName.js");

  var router = require("express").Router();
  // Define routes using controller functions
  router.post("/", companyPortfolioName, persons.create);
  // Route to send reset email
  router.post("/send-reset-email", persons.sendResetPasswordEmail);

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
  router.get(
    "/password/getChangePassword/:token",

    companyPortfolioName,
    persons.getChangePassword,
  );
  router.post(
    "/password/updatePassword",

    companyPortfolioName,
    persons.updatePassword,
  );
  router.get(
    "/password/resetPassword",

    companyPortfolioName,
    persons.updatePassword,
  );
  router.get("/password/emailSuccess", function (req, res) {
    res.render("Pages/pages-login", { layout: "layout-public" });
  });
  app.use("/persons", router);
};
