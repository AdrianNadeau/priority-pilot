module.exports = (app) => {
  const projects = require("../controllers/project.controller.js");
  // const sessionMiddleware = require("../middleware/sessionMiddleware.js");
  const checkProjectReadonly = require("../middleware/readOnlyProject");
  const companyPortfolioName = require("../middleware/companyPortfolioName.js");

  var router = require("express").Router();
  // Define routes using controller functions
  router.post("/", companyPortfolioName, projects.create);
  router.get("/", companyPortfolioName, projects.findAll);
  router.get("/:id", companyPortfolioName, projects.findOne);
  router.post("/:id", companyPortfolioName, projects.update);
  router.delete(
    "/:id",

    companyPortfolioName,
    projects.delete,
  );

  router.get(
    "/archvive/:id",

    companyPortfolioName,
    projects.archvive,
  );
  router.get(
    "/cockpit/:id",

    companyPortfolioName,
    projects.cockpit,
  );
  router.get(
    "/edit/:id",

    companyPortfolioName,
    projects.findOneForEdit,
  );
  router.get(
    "/cockpit/:id",

    companyPortfolioName,
    projects.cockpit,
  );
  router.get(
    "/funnel/view/",

    companyPortfolioName,
    projects.findFunnel,
  );
  router.get(
    "/freezer/view/",

    companyPortfolioName,
    projects.findFreezer,
  );
  router.get(
    "/radar/view/",

    companyPortfolioName,
    projects.radar,
  );

  router.get("/radar/progress/", projects.progress);
  router.get(
    "/radar/countProjectsByTag1/",

    projects.countProjectsByTag1,
  );
  router.get(
    "/radar/countCostsByTag1/",

    projects.countCostsByTag1,
  );
  router.get(
    "/radar/countEffortByTag1/",

    projects.countEffortByTag1,
  );
  router.get(
    "/radar/countProjectsByTag2/",

    projects.countProjectsByTag2,
  );
  router.get(
    "/radar/countCostsByTag2/",

    projects.countCostsByTag2,
  );
  router.get(
    "/radar/countEffortByTag2/",

    projects.countEffortByTag2,
  );
  router.get(
    "/radar/countProjectsByTag3/",

    projects.countProjectsByTag3,
  );
  router.get(
    "/radar/countCostsByTag3/",

    projects.countCostsByTag3,
  );
  router.get(
    "/radar/countEffortByTag3/",

    projects.countEffortByTag3,
  );
  router.get(
    "/flight/view/",

    companyPortfolioName,
    projects.flight,
  );
  router.get(
    "/health/view",

    companyPortfolioName,
    projects.health,
  );
  router.get(
    "/flightview/view/",

    companyPortfolioName,
    projects.flightview,
  );
  router.get("/flightview/ganttChart/", projects.ganttChart);
  router.delete(
    "/",

    companyPortfolioName,
    projects.deleteAll,
  );
  router.get(
    "/export/export-project-list/",

    projects.exportProjectsWithStatusToCSV,
  );
  router.get("/export/health-data", projects.exportHealthDataToCSV);
  app.use("/projects", router);
};
