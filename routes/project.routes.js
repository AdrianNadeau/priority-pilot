module.exports = (app) => {
  const projects = require("../controllers/project.controller.js");
  const sessionMiddleware = require("../middleware/sessionMiddleware.js");
  const checkProjectReadonly = require("../middleware/readOnlyProject");
  const companyPortfolioName = require("../middleware/companyPortfolioName.js");
  const {
    applyGlobalFilter,
  } = require("../middleware/globalFilterMiddleware.js");

  var router = require("express").Router();
  // Define routes using controller functions
  router.post(
    "/",
    sessionMiddleware,
    companyPortfolioName,
    applyGlobalFilter,
    projects.create,
  );
  router.get(
    "/",
    sessionMiddleware,
    companyPortfolioName,
    applyGlobalFilter,
    projects.findAll,
  );
  router.get(
    "/:id",
    sessionMiddleware,
    companyPortfolioName,
    applyGlobalFilter,
    projects.findOne,
  );
  router.post("/:id", sessionMiddleware, companyPortfolioName, projects.update);
  router.delete(
    "/:id",
    sessionMiddleware,
    companyPortfolioName,
    projects.delete,
  );

  router.get(
    "/archive/:id",
    sessionMiddleware,
    companyPortfolioName,
    projects.archive,
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
    applyGlobalFilter,
    projects.radar,
  );

  // New API endpoint for filtered radar data
  router.get(
    "/radar/data",
    sessionMiddleware,
    applyGlobalFilter,
    projects.radarData,
  );

  // New API endpoint for filtered health data
  router.get(
    "/health/data",
    sessionMiddleware,
    applyGlobalFilter,
    projects.healthData,
  );

  // New API endpoint for filtered accomplishments data
  router.get(
    "/accomplishments/data",
    sessionMiddleware,
    applyGlobalFilter,
    projects.accomplishmentsData,
  );

  router.get(
    "/radar/progress/",
    sessionMiddleware,
    applyGlobalFilter,
    projects.progress,
  );
  router.get(
    "/radar/countProjectsByTag1/",
    sessionMiddleware,
    applyGlobalFilter,
    projects.countProjectsByTag1,
  );
  router.get(
    "/radar/countCostsByTag1/",
    sessionMiddleware,
    applyGlobalFilter,
    projects.countCostsByTag1,
  );
  router.get(
    "/radar/countEffortByTag1/",
    sessionMiddleware,
    applyGlobalFilter,
    projects.countEffortByTag1,
  );
  router.get(
    "/radar/countProjectsByTag2/",
    sessionMiddleware,
    applyGlobalFilter,
    projects.countProjectsByTag2,
  );
  router.get(
    "/radar/countCostsByTag2/",
    sessionMiddleware,
    applyGlobalFilter,
    projects.countCostsByTag2,
  );
  router.get(
    "/radar/countEffortByTag2/",
    sessionMiddleware,
    applyGlobalFilter,
    projects.countEffortByTag2,
  );
  router.get(
    "/radar/countProjectsByTag3/",
    sessionMiddleware,
    applyGlobalFilter,
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
    applyGlobalFilter,
    projects.health,
  );
  router.get(
    "/accomplishments/view/",
    sessionMiddleware,
    companyPortfolioName,
    projects.accomplishments,
  );
  router.get(
    "/flightview/view/",
    sessionMiddleware,
    companyPortfolioName,
    projects.flightview,
  );
  router.get(
    "/flightview/ganttChart/",
    sessionMiddleware,
    applyGlobalFilter,
    projects.ganttChart,
  );
  // Diagnostic debug route
  router.get(
    "/debug/raw",
    sessionMiddleware,
    companyPortfolioName,
    projects.debugProjectsRaw,
  );
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
    "/export/export-project-health/",
    sessionMiddleware,
    projects.exportHealthDataToPDF,
  );

  router.get(
    "/export/health-data",
    sessionMiddleware,
    projects.exportHealthDataToCSV,
  );

  router.get(
    "/export/accomplishments-data",
    sessionMiddleware,
    projects.exportAccomplishmentsToCSV,
  );

  app.use("/projects", router);
};
