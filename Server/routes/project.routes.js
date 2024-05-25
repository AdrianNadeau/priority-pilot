module.exports = app => {
    const projects = require("../controllers/project.controller.js");
  
    var router = require("express").Router();
  // Define routes using controller functions
    router.post("/", projects.create);
    router.get("/", projects.findAll);
    router.get("/:id", projects.findOne);
    router.put("/:id", projects.update);
    router.delete("/:id", projects.delete);
    router.get('/cockpit/:id', projects.cockpit);
    // router.get('/:addoredite/:id', projects.cockpit);
    router.get('/radar/view/', projects.radar);
    router.get('/flight/view/', projects.flight);
    router.get('/health/view/', projects.health);
    router.delete("/", projects.deleteAll);
   
    app.use('/projects', router);
    
  };