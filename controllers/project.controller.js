const db = require("../models");
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
      tags:req.body.project_tags,
      pitch_message:pitch_message
     
    };
    // Save Project in the database
    Project.create(project)
      .then(async data => {
        //call get all function for project /projects
        const [phasesData, prioritiesData, personsData, projectsData] = await Promise.all([
          Phase.findAll(),
          Priority.findAll(),
          
          
          // Results will be an empty array and metadata will contain the number of affected rows.
          Person.findAll({
            where: {
              company_id_fk: company_id_fk,
            },
          }),
          Project.findAll() 
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
          const [phasesData, prioritiesData, projectsData] = await Promise.all([
              Phase.findAll(),
              Priority.findAll(),
              // Results will be an empty array and metadata will contain the number of affected rows.
              
              Project.findAll() // Assuming Project.findAll() returns a Promise
          ]);
          const personsData = await Person.findAll({
            where: {
              company_id_fk: company_id_fk  // Replace `specificCompanyId` with the actual value or variable
            }
          });
          
          const query ='SELECT proj.company_id_fk,proj.id, proj.project_name, proj.start_date, proj.end_date,  prime_person.first_name AS prime_first_name, prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name, sponsor_person.last_name AS sponsor_last_name, proj.project_cost, phases.phase_name FROM projects proj LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk LEFT JOIN phases ON phases.id = proj.phase_id_fk WHERE proj.company_id_fk = ?';
          
       await db.sequelize.query(query, {
        replacements: [company_id_fk],
              type: db.sequelize.QueryTypes.SELECT
          }).then(data => {
              // console.log("***************************************************:",data)
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
    const query = `
    SELECT 
      proj.company_id_fk, 
      proj.id, 
      proj.effort,
      proj.benefit, 
      proj.prime_id_fk, 
      proj.project_headline, 
      proj.project_name, 
      proj.start_date, 
      proj.end_date, 
      proj.next_milestone_date, 
      proj.project_why, 
      proj.project_what,
      proj.tags, 
      prime_person.first_name AS prime_first_name, 
      prime_person.last_name AS prime_last_name, 
      sponsor_person.first_name AS sponsor_first_name, 
      sponsor_person.last_name AS sponsor_last_name, 
      proj.project_cost, 
      phases.phase_name, 
      proj.pitch_message, 
      proj.phase_id_fk, 
      proj.priority_id_fk, 
      proj.sponsor_id_fk, 
      proj.prime_id_fk,
      statuses.accomplishments  -- Added this line
    FROM 
      projects proj 
    LEFT JOIN 
      persons prime_person ON prime_person.id = proj.prime_id_fk 
    LEFT JOIN 
      persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk 
    LEFT JOIN 
      phases ON phases.id = proj.phase_id_fk
    LEFT JOIN 
      statuses ON statuses.project_id_fk = proj.id
    WHERE 
      proj.company_id_fk = ? 
      AND proj.id = ?;
  `;
  
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
            ['change_date', 'DESC'] 
          ]
        });
        const statuses = await Status.findAll({
          where: {
            project_id_fk: project_id
          },
          order: [
            ['status_date', 'DESC'] 
          ]
        });
        let lastStatusDate = null;
        let statusColor=null;
        if (statuses.length > 0) {
            lastStatusDate = statuses[0].status_date;
            statusColor=statuses[0].health;
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
exports.findOneForEdit = async (req, res) => {
  console.log("FIND FOR EDIT")
  try {
    const project_id = req.params.id;
    let company_id_fk;

    // Ensure session exists and fetch company ID
    if (!req.session || !req.session.company) {
      res.redirect("/pages-500");
    }
    
    company_id_fk = req.session.company.id;

    // Query to fetch project details
    const query = `
     SELECT proj.company_id_fk, proj.id, proj.effort,proj.benefit, proj.prime_id_fk, 
             proj.project_headline, proj.project_name, proj.start_date, 
             proj.end_date, proj.next_milestone_date, proj.project_why, 
             proj.project_what,proj.tags, prime_person.first_name AS prime_first_name, 
             prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name, 
             sponsor_person.last_name AS sponsor_last_name, proj.project_cost, 
             phases.phase_name, proj.pitch_message, proj.phase_id_fk, proj.priority_id_fk, proj.sponsor_id_fk, proj.prime_id_fk
      FROM projects proj 
      LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk 
      LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk 
      LEFT JOIN phases ON phases.id = proj.phase_id_fk
      WHERE proj.company_id_fk = ? AND proj.id = ?`;

    const currentDate = new Date();

    try {
      // Execute the query
      const data = await db.sequelize.query(query, {
        replacements: [company_id_fk, project_id],
        type: db.sequelize.QueryTypes.SELECT
      });

      if (!data || data.length === 0) {
        return res.status(404).send({ message: "Project not found" });
      }

      // Format the project cost
      const formatter = new Intl.NumberFormat();
      const formattedCost = formatter.format(data[0].project_cost);

      // Get change logs for the project
      const change_logs = await ChangeLog.findAll({
        where: { project_id_fk: project_id },
        order: [['change_date', 'DESC']]
      });

      // Get statuses for the project
      const statuses = await Status.findAll({
        where: { project_id_fk: project_id },
        order: [['status_date', 'DESC']]
      });

      let lastStatusDate = null;
      let statusColor = null;

      if (statuses.length > 0) {
        lastStatusDate = statuses[0].status_date;
        statusColor = statuses[0].health;
      }

      const [phasesData, prioritiesData] = await Promise.all([
        Phase.findAll(),
        Priority.findAll(),
        Project.findAll() // Assuming Project.findAll() returns a Promise
    ]);
      // Render the cockpit page with the retrieved data
      const personsData = await Person.findAll({
        where: {
          company_id_fk: company_id_fk  // Replace `specificCompanyId` with the actual value or variable
        }
      });
      res.render('Pages/pages-edit-project', {
        project: data[0], // Pass the first element of the data array
        // current_date: currentDate,
        // formattedCost: formattedCost,
        phases: phasesData,
        priorities: prioritiesData,
        sponsors: personsData,
        primes: personsData,

      });
      
    } catch (err) {
      console.error("Error retrieving data:", err);
      res.status(500).send({
        message: err.message || "Error occurred while retrieving data."
      });
    }

  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      message: "An unexpected error occurred."
    });
  }
};


exports.radar = async (req, res) => {
  let company_id_fk;

  try {
    if (!req.session) {
      return res.redirect("/pages-500");
    } else {
      company_id_fk = req.session.company.id;
    }
  } catch (error) {
    console.log("Error:", error);
  }

  const query = `
  SELECT
    SUM(CASE WHEN phase_id_fk = 2 THEN 1 ELSE 0 END) AS phase_2_count,
    SUM(CASE WHEN phase_id_fk = 3 THEN 1 ELSE 0 END) AS phase_3_count,
    SUM(CASE WHEN phase_id_fk = 4 THEN 1 ELSE 0 END) AS phase_4_count,
    SUM(CASE WHEN phase_id_fk = 5 THEN 1 ELSE 0 END) AS phase_5_count,
    SUM(CASE WHEN phase_id_fk = 2 THEN project_cost ELSE 0 END) AS phase_2_total_cost,
    SUM(CASE WHEN phase_id_fk = 3 THEN project_cost ELSE 0 END) AS phase_3_total_cost,
    SUM(CASE WHEN phase_id_fk = 4 THEN project_cost ELSE 0 END) AS phase_4_total_cost,
    SUM(CASE WHEN phase_id_fk = 5 THEN project_cost ELSE 0 END) AS phase_5_total_cost
  FROM 
    projects
  WHERE 
    company_id_fk = ?
`;

  try {
    // Execute the query
    const data = await db.sequelize.query(query, {
      replacements: [company_id_fk],
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (!data || data.length === 0) {
      return res.status(404).send({ message: "Project Health not found" });
    }

    // Pass the result to the EJS template
    const phase2Count = Number(data[0].phase_2_count);
    const phase3Count = Number(data[0].phase_3_count);
    const phase4Count = Number(data[0].phase_4_count);
    // Extract and log raw data
    const phase2TotalCost = Number(data[0].phase_2_total_cost) || 0;
    const phase3TotalCost = Number(data[0].phase_3_total_cost) || 0;
    const phase4TotalCost = Number(data[0].phase_4_total_cost) || 0;
    let in_flight_count= phase3Count+ phase4Count;
    console.log("flight count:",in_flight_count)
    let in_flight_cost = formatCost(phase3TotalCost + phase4TotalCost);
      res.render('Pages/pages-radar', {
        phase_2_count: data[0].phase_2_count,
        in_flight_count: in_flight_count,
        phase_5_count: data[0].phase_5_count,
        phase_2_total_cost: formatCost(data[0].phase_2_total_cost),
        in_flight_cost:in_flight_cost,
        phase_5_total_count:  phase4Count,
        phase_5_total_cost: formatCost(data[0].phase_5_total_cost),
      });
    } catch (error) {
      console.log("Query error:", error);
      return res.status(500).send({ message: "Server error" });
    }
};

exports.flight = async (req, res) => {
  let company_id_fk;
  try {
      if (!req.session || !req.session.company) {
          return res.redirect("/pages-500");
      } else {
          company_id_fk = req.session.company.id;
      }
  } catch (error) {
      console.log("Error:", error);
  }

  const query = `
      SELECT 
    proj.start_date,
    proj.end_date, 
    proj.next_milestone_date,
    proj.company_id_fk, 
    proj.id, 
    proj.impact,
    proj.effort,
    proj.benefit, 
    proj.prime_id_fk, 
    proj.health,
    statuses.issue, 
    statuses.actions, 
    proj.project_name,
    proj.tags,
    prime_person.first_name AS prime_first_name, 
    prime_person.last_name AS prime_last_name, 
    sponsor_person.first_name AS sponsor_first_name, 
    sponsor_person.last_name AS sponsor_last_name, 
    proj.project_cost, 
    phases.phase_name, 
    proj.pitch_message, 
    proj.phase_id_fk, 
    proj.priority_id_fk, 
    proj.sponsor_id_fk, 
    proj.prime_id_fk
FROM 
    projects proj 
LEFT JOIN 
    persons prime_person ON prime_person.id = proj.prime_id_fk 
LEFT JOIN 
    persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk 
LEFT JOIN 
    phases ON phases.id = proj.phase_id_fk
LEFT JOIN 
    statuses ON statuses.project_id_fk = proj.id
WHERE 
    proj.company_id_fk = ?
ORDER BY 
    proj.phase_id_fk;

  `;

  try {
    
      // Execute the query
      const data = await db.sequelize.query(query, {
          replacements: [company_id_fk],
          type: db.sequelize.QueryTypes.SELECT,
      });

      if (!data || data.length === 0) {
          return res.status(404).send({ message: "Project Health not found" });
      }
      let startDateTest = insertValidDate(data);
      
      // Pass the result to the EJS template
      res.render('Pages/pages-flight-plan', {
          start_date: startDateTest,
          health_data: data
      });
  } catch (error) {
      console.log("Query error:", error);
      return res.status(500).send({ message: "Server error" });
  }
};

  
  exports.health = async  (req, res) => {
   
    // 
      res.render('Pages/pages-health');
   
  };
// Update a Project by the id in the request
exports.update = (req, res) => {
    console.log("UPDATE PROJECT")
    const id = req.params.id;
    console.log("ID:",id)
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
  // Format cost values to K/M format
  const formatCost = (cost) => {
    console.log("************************************* cost:",cost)
    if (cost >= 1e6) {
      return (cost / 1e6).toFixed(0) + 'M'; // Convert to millions
    } else if (cost >= 1e3) {
      return (cost / 1e3).toFixed(0) + 'K'; // Convert to thousands
    } else {
      return cost.toString(); // No conversion
    }
  };

