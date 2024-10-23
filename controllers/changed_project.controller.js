const db = require("../models");
const Project = db.projects;
const ChangeProject=db.change_projects;
const Phase = db.phases;
const Priority = db.priorities;
const Person = db.persons;
const ChangeLog = db.changeLogs;
const ChangeReason=db.change_reasons;
const Status=db.statuses;
const sequelize= require("sequelize");
const Op = db.Sequelize.Op;
const currentDate = new Date();
// Create and Save a new Project
exports.create = (req, res) => {
  
  if(req.session.company.id==null){
    res.redirect("/login");
  }
  const company_id_fk = req.session.company.id;
 
   
  if (!req.body.project_name) {
    res.status(400).send({
      message: "Project Name can not be empty!"
    });
    return;
  }
  //convert dates
    
  const startDateTest = insertValidDate(req.body.start_date);
  const endDateTest = insertValidDate(req.body.end_date);
  const nextMilestoneDateTest = insertValidDate(req.body.next_milestone_date);
  const deletedDateTest = insertValidDate(req.body.deleted_date);
  const changeDateTest = insertValidDate(req.body.change_date);

  let pitch_message="";
  if(req.body.phase_id_fk==1){
    pitch_message=req.body.pitch_message;
  }
    
  // Create a Project
  const changed_project = {
    company_id_fk : company_id_fk,
    project_id_fk : project_id_fk,
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
    project_cost :req.body.project_cost,
    effort:req.body.effort,
    benefit:req.body.benefit,
    complexity:req.body.complexity,
    tags:req.body.tags,
    change_reason_id_fk:req.body.change_reason,
    change_explanation:req.body.change_explanation
  };
    // Save Project in the database
  ChangeProject.create(changed_project)
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
        Project.findAll() ,
        ChangeReason.findAll()
      ]);
      
      const query ="SELECT proj.company_id_fk,proj.id, proj.project_name, proj.start_date, proj.end_date, prime_person.first_name AS prime_first_name, prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name, sponsor_person.last_name AS sponsor_last_name, proj.project_cost, phases.phase_name FROM projects proj LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk LEFT JOIN phases ON phases.id = proj.phase_id_fk WHERE proj.company_id_fk = ?";
      
      await db.sequelize.query(query, {
        replacements: [company_id_fk],
        type: db.sequelize.QueryTypes.SELECT
      }).then(data => {
        // Render the page when all data retrieval operations are complete
        res.render("Pages/pages-projects", {
          projects: data,
          phases: phasesData,
          priorities: prioritiesData,
          sponsors: personsData,
          primes: personsData,
          change_reasons:ChangeReason
              
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
    console.log("Get all projects for company");
    let company_id_fk;
    try{
      if(!req.session){
        res.redirect("/pages-500");
      }
      else{
        console.log("we have a session");
        company_id_fk = req.session.company.id;
      }
    }catch(error){
      console.log("error:",error);
    }
    console.log("COMPANY_ID",company_id_fk);
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
          
    const query ="SELECT proj.company_id_fk,proj.id, proj.project_name, proj.start_date, proj.end_date,  prime_person.first_name AS prime_first_name, prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name, sponsor_person.last_name AS sponsor_last_name, proj.project_cost, phases.phase_name FROM projects proj LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk LEFT JOIN phases ON phases.id = proj.phase_id_fk WHERE proj.company_id_fk = ?";
          
    await db.sequelize.query(query, {
      replacements: [company_id_fk],
      type: db.sequelize.QueryTypes.SELECT
    }).then(data => {
      // console.log("***************************************************:",data)
      // Render the page when all data retrieval operations are complete
      res.render("Pages/pages-projects", {
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
    console.log("error:", error);
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

exports.findOneForEdit = async (req, res) => {
  
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
             proj.project_headline, proj.project_name, proj.project_description,proj.start_date, 
             proj.end_date, proj.next_milestone_date, proj.project_why, 
             proj.project_what,proj.tags,proj.effort, prime_person.first_name AS prime_first_name, 
             prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name, 
             sponsor_person.last_name AS sponsor_last_name, proj.project_cost, 
             phases.phase_name, proj.pitch_message, proj.phase_id_fk, proj.priority_id_fk, proj.sponsor_id_fk, proj.prime_id_fk
      FROM projects proj 
      LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk 
      LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk 
      LEFT JOIN phases ON phases.id = proj.phase_id_fk
      WHERE proj.company_id_fk = ? AND proj.id = ?`;

    

    try {
      // Execute the query
      const data = await db.sequelize.query(query, {
        replacements: [company_id_fk, project_id],
        type: db.sequelize.QueryTypes.SELECT
      });

      if (!data || data.length === 0) {
        return res.status(404).send({ message: "Project not found" });
      }

      

      // // Get change logs for the project
      // const change_logs = await ChangeLog.findAll({
      //   where: { project_id_fk: project_id },
      //   order: [['change_date', 'DESC']]
      // });

      

      // Get reasons for change for the project
      const change_reasons = await ChangeReason.findAll();
      let lastStatusDate = null;
      let statusColor = null;
    
      // Get statuses for the project
      const statuses = await Status.findAll({
        where: { project_id_fk: project_id },
        order: [["status_date", "DESC"]]
      });
      if (statuses.length > 0) {
        lastStatusDate = statuses[0].status_date;
        statusColor = statuses[0].health;
      }
      
      const [phasesData, prioritiesData] = await Promise.all([
        Phase.findAll(),
        Priority.findAll(),
        Project.findAll(),
       
       

      ]);
    
      // Render the cockpit page with the retrieved data
      const personsData = await Person.findAll({
        where: {
          company_id_fk: company_id_fk  // Replace `specificCompanyId` with the actual value or variable
        }
      });
      res.render("Pages/pages-edit-project", {
        project: data[0], // Pass the first element of the data array
        current_date: currentDate,
        formattedCost: data[0].project_cost,
        phases: phasesData,
        priorities: prioritiesData,
        sponsors: personsData,
        primes: personsData,
        change_reasons:change_reasons

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

// Update a Project by the id in the request
exports.update = (req, res) => {
   
  const id = req.params.id;
  console.log("UPDATE PROJECT:*************:",id);
  // for (let key in req.body) {
  //   if (req.body.hasOwnProperty(key) && key.endsWith('_cost')|| key.endsWith("effort") || key.endsWith("benefit")) { // Check if the key ends with '_cost'
  //     // let value = req.body[key].replace(/,/g, ''); // Remove all commas
  //     req.body[key] = formatCost(value); // Format and update the value in req.body
  //     console.log("value:",value)  
  //   }
  // }
    
  const project_id = req.params.id;
  let company_id_fk;

  // Ensure session exists and fetch company ID
  if (!req.session || !req.session.company) {
    res.redirect("/pages-500");
  }
  const startDateTest = insertValidDate(req.body.start_date);
  const endDateTest = insertValidDate(req.body.end_date);
  const nextMilestoneDateTest = insertValidDate(req.body.next_milestone_date);
  const deletedDateTest = insertValidDate(req.body.deleted_date);
  const changeDateTest = insertValidDate(req.body.change_date);
  company_id_fk = req.session.company.id;
  // Create a Project Object
  const project = {
    company_id_fk : company_id_fk,
    project_id_fk : id,
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
    project_cost :req.body.project_cost,
    effort:req.body.effort,
    benefit:req.body.benefit,
    complexity:req.body.complexity,
    tags:req.body.project_tags,
    change_reason_id_fk:req.body.change_reason,
    change_reason_details:req.body.change_reason_details,
      
     
  };
  console.log("PROJECT:", id);

  Project.update(project, {
    where: { id: id }
  })
    .then(result => {
      const [numAffected] = result;
      if (numAffected == 1) {
        res.redirect("/projects");
      } else {
        res.send({
          message: `Cannot update Project with id=${id}. Maybe Project was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      console.log(err);
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

