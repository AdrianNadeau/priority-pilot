module.exports = (app) => {
  const projects = require("../controllers/project.controller.js");
  const sessionMiddleware = require("../middleware/sessionMiddleware.js");

  var router = require("express").Router();
  // Define routes using controller functions
  router.post("/", sessionMiddleware, projects.create);
  router.get("/", sessionMiddleware, projects.findAll);
  router.get("/:id", sessionMiddleware, projects.findOne);
  router.post("/:id", sessionMiddleware, projects.update);
  router.delete("/:id", sessionMiddleware, projects.delete);

  router.get("/archvive/:id", sessionMiddleware, projects.archvive);
  router.get("/cockpit/:id", sessionMiddleware, projects.cockpit);
  router.get("/edit/:id", sessionMiddleware, projects.findOneForEdit);
  router.get("/cockpit/:id", sessionMiddleware, projects.cockpit);
  router.get("/funnel/view/", sessionMiddleware, projects.findFunnel);
  router.get("/freezer/view/", sessionMiddleware, projects.findFreezer);
  router.get("/radar/view/", sessionMiddleware, projects.radar);
  router.get("/radar/progress/", sessionMiddleware, projects.progress);
  router.get(
    "/radar/countProjectsByTag1/",
    sessionMiddleware,
    projects.countProjectsByTag1,
  );
  router.get(
    "/radar/countProjectsByTag2/",
    sessionMiddleware,
    projects.countProjectsByTag2,
  );
  router.get(
    "/radar/countProjectsByTag3/",
    sessionMiddleware,
    projects.countProjectsByTag3,
  );
  router.get("/flight/view/", sessionMiddleware, projects.flight);
  router.get("/health/view", sessionMiddleware, projects.health);
  router.get("/flightview/view/", sessionMiddleware, projects.flightview);
  router.get("/flightview/ganttChart/", sessionMiddleware, projects.ganttChart);
  router.delete("/", sessionMiddleware, projects.deleteAll);

  app.use("/projects", router);
};
