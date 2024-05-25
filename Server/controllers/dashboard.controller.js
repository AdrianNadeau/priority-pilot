const db = require("../models");
const Project = db.projects;
const sequelize= require('sequelize')
const Op = db.Sequelize.Op;

//load all projects by stage
console.log("get all projects");
const query = "SELECT projects.project_id, phases.phase_id, phases.phase_name FROM projects JOIN phases ON projects.project_id = phases.phase_id_fk ORDER BY projects.project_id, phases.phase_id;"

try {
    const data = await db.sequelize.query(query ,{
        // replacements: {id: company_id_fk},
        type: db.sequelize.QueryTypes.SELECT
    });
    
    res.send(data);
    //   res.render('Dashboard/dashboard1');
} catch (err) {
    res.status(500).send({
        message: err.message || "Some error occurred while retrieving projects."
    });
}