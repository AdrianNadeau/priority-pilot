module.exports = (app) => {
  const changed_projects = require("../controllers/changed_project.controller.js");

  var router = require("express").Router();
  // Define routes using controller functions
  router.post("/", changed_projects.create);
  router.get("/", changed_projects.findAll);
  router.get("/:id", changed_projects.findOne);
  router.post("/:id", changed_projects.update);
  router.delete("/:id", changed_projects.delete);
  // router.get("/changed/:id/:companyid", changed_projects.findAllByProjectId);
  router.get("/changedlog/:id/", changed_projects.findAllByProjectId);

  // router.get("/cockpit/:id", projects.cockpit);
  // router.get("/edit/:id", projects.findOneForEdit);
  // router.get("/radar/view/", projects.radar);
  // router.get("/flight/view/", projects.flight);
  // router.get("/health/view/", projects.health);
  // router.delete("/", projects.deleteAll);

  app.use("/changed_projects", router);
};
