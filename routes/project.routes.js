module.exports = (app) => {
  const projects = require("../controllers/project.controller.js");
  const sessionMiddleware = require("../middleware/sessionMiddleware.js");
  const checkProjectReadonly = require("../middleware/readOnlyProject");
  const companyPortfolioName = require("../middleware/companyPortfolioName.js");

  var router = require("express").Router();
  // Define routes using controller functions
  router.post("/", sessionMiddleware, companyPortfolioName, projects.create);
  router.get("/", sessionMiddleware, companyPortfolioName, projects.findAll);
  router.get("/:id", sessionMiddleware, companyPortfolioName, projects.findOne);
  router.post("/:id", sessionMiddleware, companyPortfolioName, projects.update);
  router.delete(
    "/:id",
    sessionMiddleware,
    companyPortfolioName,
    projects.delete,
  );

  router.get(
    "/archvive/:id",
    sessionMiddleware,
    companyPortfolioName,
    projects.archvive,
  );
  router.get(
    "/cockpit/:id",
    sessionMiddleware,
    companyPortfolioName,
    projects.cockpit,
  );
  router.get(
    "/edit/:id",
    sessionMiddleware,
    companyPortfolioName,
    projects.findOneForEdit,
  );
  router.get(
    "/cockpit/:id",
    sessionMiddleware,
    companyPortfolioName,
    projects.cockpit,
  );
  router.get(
    "/funnel/view/",
    sessionMiddleware,
    companyPortfolioName,
    projects.findFunnel,
  );
  router.get(
    "/freezer/view/",
    sessionMiddleware,
    companyPortfolioName,
    projects.findFreezer,
  );
  router.get(
    "/radar/view/",
    sessionMiddleware,
    companyPortfolioName,
    projects.radar,
  );

  router.get("/radar/progress/", sessionMiddleware, projects.progress);
  router.get(
    "/radar/countProjectsByTag1/",
    sessionMiddleware,
    projects.countProjectsByTag1,
  );
  router.get(
    "/radar/countCostsByTag1/",
    sessionMiddleware,
    projects.countCostsByTag1,
  );
  router.get(
    "/radar/countEffortByTag1/",
    sessionMiddleware,
    projects.countEffortByTag1,
  );
  router.get(
    "/radar/countProjectsByTag2/",
    sessionMiddleware,
    projects.countProjectsByTag2,
  );
  router.get(
    "/radar/countCostsByTag2/",
    sessionMiddleware,
    projects.countCostsByTag2,
  );
  router.get(
    "/radar/countEffortByTag2/",
    sessionMiddleware,
    projects.countEffortByTag2,
  );
  router.get(
    "/radar/countProjectsByTag3/",
    sessionMiddleware,
    projects.countProjectsByTag3,
  );
  router.get(
    "/radar/countCostsByTag3/",
    sessionMiddleware,
    projects.countCostsByTag3,
  );
  router.get(
    "/radar/countEffortByTag3/",
    sessionMiddleware,
    projects.countEffortByTag3,
  );
  router.get(
    "/flight/view/",
    sessionMiddleware,
    companyPortfolioName,
    projects.flight,
  );
  router.get(
    "/health/view",
    sessionMiddleware,
    companyPortfolioName,
    projects.health,
  );
  router.get(
    "/flightview/view/",
    sessionMiddleware,
    companyPortfolioName,
    projects.flightview,
  );
  router.get("/flightview/ganttChart/", sessionMiddleware, projects.ganttChart);
  router.delete(
    "/",
    sessionMiddleware,
    companyPortfolioName,
    projects.deleteAll,
  );
  router.get(
    "/export/export-project-list/",
    sessionMiddleware,
    projects.exportProjectsWithStatusToCSV,
  );
  router.get(
    "/export/health-data",
    sessionMiddleware,
    projects.exportHealthDataToCSV,
  );
  app.use("/projects", router);
};
