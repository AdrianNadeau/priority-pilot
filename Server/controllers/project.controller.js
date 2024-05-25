const db = require("../models/server");
const Project = db.projects;
const Phase = db.phases;
const Priority = db.priorities;
const Person = db.persons;
const ChangeLog = db.change_logs;
const Status=db.statuses;
const sequelize= require('sequelize')
const Op = db.Sequelize.Op;

// Create and Save a new Project
exports.create = (req, res) => {
  if(req.session.company.id==null){
    res.redirect('/login');
  }
  const company_id_fk = req.session.company.id
 
   
    if (!req.body.project_name) {
      res.status(400).send({
        message: "Project Name can not be empty!"
      });
      return;
    }
    //convert dates
    let startDateTest = insertValidDate(req.body.start_date);
    let endDateTest = insertValidDate(req.body.end_date);
    let nextMilestoneDateTest = insertValidDate(req.body.next_milestone_date);
    let deletedDateTest = insertValidDate(req.body.deleted_date);
    let changeDateTest = insertValidDate(req.body.change_date);

    let pitch_message='';
    if(req.body.phase_id_fk==1){
      pitch_message=req.body.pitch_message;
    }
    console.log("pitch_message:",pitch_message)

    let formattedCost = req.body.project_cost.replace(/,/g, ''); // Remove all commas
    // console.log("formattedCost:",formattedCost)
    let numberValue = parseFloat(formattedCost);
    // console.log("numberValue:",numberValue)
    // Create a Project
    const project = {
      company_id_fk : company_id_fk,
      project_name: req.body.project_name,
      project_headline :req.body.project_headline,
      project_description :req.body.project_description,
      project_why :req.body.project_why,
      project_what :req.body.project_what,
      start_date :startDateTest,
      end_date :endDateTest,
      next_milestone_date :nextMilestoneDateTest,
      deleted_date:deletedDateTest,
      change_date:changeDateTest,
      priority_id_fk :req.body.priority_id_fk,
      sponsor_id_fk:req.body.sponsor_id_fk,
      prime_id_fk:req.body.prime_id_fk,
      phase_id_fk :req.body.phase_id_fk,
      project_cost :numberValue,
      effort:req.body.effort,
      benefit:req.body.benefit,
      complexity:req.body.complexity,
      tags:req.body.tags,
      pitch_message:pitch_message
     
    };
    // Save Project in the database
    Project.create(project)
      .then(async data => {
        //call get all function for project /projects
        const [phasesData, prioritiesData, personsData, projectsData] = await Promise.all([
          Phase.findAll(),
          Priority.findAll(),
          Person.findAll(),
          Project.findAll() // Assuming Project.findAll() returns a Promise
      ]);
      const query ='SELECT proj.company_id_fk,proj.id, proj.project_name, proj.start_date, proj.end_date, prime_person.first_name AS prime_first_name, prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name, sponsor_person.last_name AS sponsor_last_name, proj.project_cost, phases.phase_name FROM projects proj LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk LEFT JOIN phases ON phases.id = proj.phase_id_fk WHERE proj.company_id_fk = ?';
      
   await db.sequelize.query(query, {
    replacements: [company_id_fk],
          type: db.sequelize.QueryTypes.SELECT
      }).then(data => {
        
          // Render the page when all data retrieval operations are complete
          res.render('Pages/pages-projects', {
              projects: data,
              phases: phasesData,
              priorities: prioritiesData,
              sponsors: personsData,
              primes: personsData
          });
      }).catch(err => {
          res.status(500).send({
              message: err.message || "Some error occurred while retrieving data."
          });
      });

      });
  };

// Retrieve all  from the database.
exports.findAll = async (req, res) => {
  
        try {
          console.log("Get all projects for company")
          let company_id_fk;
          try{
            if(!req.session){
                res.redirect("/pages-500")
            }
            else{
              company_id_fk = req.session.company.id
             }
          }catch(error){
            console.log("error:",error)
          }
          // console.log("company_id_fk:",company_id_fk)
          // Retrieve data from all sources
          const [phasesData, prioritiesData, personsData, projectsData] = await Promise.all([
              Phase.findAll(),
              Priority.findAll(),
              Person.findAll(),
              Project.findAll() // Assuming Project.findAll() returns a Promise
          ]);
          const query ='SELECT proj.company_id_fk,proj.id, proj.project_name, proj.start_date, proj.end_date,  prime_person.first_name AS prime_first_name, prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name, sponsor_person.last_name AS sponsor_last_name, proj.project_cost, phases.phase_name FROM projects proj LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk LEFT JOIN phases ON phases.id = proj.phase_id_fk WHERE proj.company_id_fk = ?';
          
       await db.sequelize.query(query, {
        replacements: [company_id_fk],
              type: db.sequelize.QueryTypes.SELECT
          }).then(data => {
            
              // Render the page when all data retrieval operations are complete
              res.render('Pages/pages-projects', {
                  projects: data,
                  phases: phasesData,
                  priorities: prioritiesData,
                  sponsors: personsData,
                  primes: personsData
              });
          }).catch(err => {
              res.status(500).send({
                  message: err.message || "Some error occurred while retrieving data."
              });
          });
      
         
      }
      catch(error){
        console.log("error:", error)
      }
           
    };
// Find a single Project with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  
  if(id){
    Project.findByPk(id)
    .then(data => {
      if (data) {
        
        res.status(200).send(data);
      
      
      } else {
        res.status(404).send({
          message: `Cannot find Project with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Project with id=" + id
      });
    });
  }
   
  };
  exports.cockpit = async (req, res) => {
    const project_id = req.params.id;
    let company_id_fk;
    try {
        if (!req.session) {
            res.redirect("/pages-500");
        } else {
            company_id_fk = req.session.company.id;
        }
    } catch (error) {
        console.log("error:", error);
    }

    // Check password by encrypted value
    // project for cockpit
    const query = 'SELECT proj.company_id_fk,proj.id, proj.effort, proj.prime_id_fk, proj.project_headline, proj.project_name, proj.start_date, proj.end_date, proj.next_milestone_date, proj.project_why, proj.project_what, prime_person.first_name AS prime_first_name, prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name, sponsor_person.last_name AS sponsor_last_name, proj.project_cost, phases.phase_name FROM projects proj LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk LEFT JOIN phases ON phases.id = proj.phase_id_fk WHERE proj.company_id_fk = ? AND proj.id = ?';
    const currentDate = new Date();
    //format investment dollar amt

    try {
        const data = await db.sequelize.query(query, {
            replacements: [company_id_fk, req.params.id],
            type: db.sequelize.QueryTypes.SELECT
        });
        var formatter = new Intl.NumberFormat();
        var formattedCost = formatter.format(data[0].project_cost);
        //get change logs for project
        const change_logs = await ChangeLog.findAll({
          where: {
            project_id_fk: project_id
          },
          order: [
            ['change_date', 'ASC'] 
          ]
        });
        const statuses = await Status.findAll({
          where: {
            project_id_fk: project_id
          },
          order: [
            ['status_date', 'ASC'] 
          ]
        });
        let lastStatusDate = null;
        let statusColor=null;
        if (statuses.length > 0) {
            lastStatusDate = statuses[statuses.length - 1].status_date;
            statusColor=statuses[statuses.length - 1].health
        }
        res.render('Pages/pages-cockpit', {
            project: data,
            current_date: currentDate,
            formattedCost: formattedCost,
            changeLogs:change_logs,
            statuses: statuses,
            lastStatusDate:lastStatusDate,
            statusColor:statusColor
        });
    } catch (err) {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving data."
        });
    }
};

  exports.radar = async  (req, res) => {
   
    res.render('Pages/pages-radar')
  };
  exports.flight = async  (req, res) => {
    res.render('Pages/pages-flight-plan')
  };
    
  
  // exports.flightplan = async  (req, res) => {
   
    
  //    const id = req.params.id;
  
  //   // Check password by encrypted value
  //   // project for cockpit
  //   const project = await Project.findOne({ id: id });
  //   // res.send(project)
    
  //   if (!project) {
  //     return res.status(404).json({ message: "Project not found." });
  //   }
   
  //   if (project) {
  //    const sponsor = await Person.findOne({ id: project.sponsor_id_fk });
  //     if(!sponsor.first_name){
  //       sponsor.first_name = "N/A";
  //       sponsor.last_name  = "N/A";
  //     }
  //     const prime = await Person.findOne({ id: project.prime_id_fk });
  //     if(!prime.first_name){
  //       sponsor.first_name = "N/A";
  //       sponsor.last_name = "N/A";
  //     }
  //     res.render('Pages/pages-flight-plan');
  //   } else {
  //     // res.redirect('/login'); // Redirect to login page if company not found
  //   }
  // };
  exports.health = async  (req, res) => {
   
    // 
      res.render('Pages/pages-health');
   
  };
// Update a Project by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;
  
    Project.update(req.body, {
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Project was updated successfully."
          });
        } else {
          res.send({
            message: `Cannot update Project with id=${id}. Maybe Project was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error updating Project with id=" + id
        });
      });
  };

// Delete a Project with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
  
    Project.destroy({
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Project was deleted successfully!"
          });
        } else {
          res.send({
            message: `Cannot delete Project with id=${id}. Maybe Project was not found!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Could not delete Project with id=" + id
        });
      });
  };

// Delete all  from the database.
exports.deleteAll = (req, res) => {
  Project.destroy({
      where: {},
      truncate: false
    })
      .then(nums => {
        res.send({ message: `${nums} Companies were deleted successfully!` });
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while removing all companies."
        });
      });
  };
  function insertValidDate(dateString) {
    var date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return null; // Return null for invalid dates
    } else {
      return date; // Return the valid date
    }
  }

