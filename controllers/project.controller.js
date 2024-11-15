const db = require("../models");
const Project = db.projects;
const Phase = db.phases;
const Priority = db.priorities;
const Person = db.persons;
const ChangeLog = db.changeLogs;
const ChangeReason = db.change_reasons;
const ChangeProject = db.changed_projects;
const Status = db.statuses;
const sequelize = require("sequelize");
const Op = db.Sequelize.Op;
const currentDate = new Date();
const moment = require("moment");
const moment_zone = require("moment-timezone");

// Create and Save a new Project

exports.create = (req, res) => {
  try {
    if (!req.session) {
      res.redirect("/pages-500");
    } else {
      company_id_fk = req.session.company.id;
    }
  } catch (error) {
    console.log("error:", error);
  }

  //convert dates

  const startDateTest = insertValidDate(req.body.start_date);
  console.log("startDateTest:", startDateTest);
  const endDateTest = insertValidDate(req.body.end_date);
  console.log("endDateTest:", endDateTest);
  const nextMilestoneDateTest = insertValidDate(req.body.next_milestone_date);
  console.log("nextMilestoneDateTest:", nextMilestoneDateTest);

  let pitch_message = "";
  if (req.body.phase_id_fk == 1) {
    pitch_message = req.body.pitch_message;
  }
  console.log("create project");
  // Create a Project
  const project = {
    company_id_fk: company_id_fk,
    project_name: req.body.project_name,
    project_headline: req.body.project_headline,
    project_description: req.body.project_description,
    project_why: req.body.project_why,
    project_what: req.body.project_what,
    start_date: startDateTest,
    end_date: endDateTest,
    next_milestone_date: nextMilestoneDateTest,
    priority_id_fk: req.body.priority_id_fk,
    sponsor_id_fk: req.body.sponsor_id_fk,
    prime_id_fk: req.body.prime_id_fk,
    phase_id_fk: req.body.phase_id_fk,
    project_cost: req.body.project_cost,
    effort: req.body.effort,
    benefit: req.body.benefit,
    impact: req.body.impact,
    complexity: req.body.complexity,
    tags: req.body.project_tags,
    pitch_message: pitch_message,
  };
  // Save Project in the database
  Project.create(project).then(async (data) => {
    //call get all function for project /projects
    const [phasesData, prioritiesData, personsData, projectsData] =
      await Promise.all([
        Phase.findAll(),
        Priority.findAll(),

        // Results will be an empty array and metadata will contain the number of affected rows.
        Person.findAll({
          where: {
            company_id_fk: company_id_fk,
          },
        }),
        Project.findAll(),
        // ChangeReason.findAll()
      ]);

    const query =
      "SELECT proj.company_id_fk,proj.id, proj.project_name, proj.start_date, proj.end_date, prime_person.first_name AS prime_first_name, prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name, sponsor_person.last_name AS sponsor_last_name, proj.project_cost, phases.phase_name FROM projects proj LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk LEFT JOIN phases ON phases.id = proj.phase_id_fk WHERE proj.company_id_fk = ?";

    await db.sequelize
      .query(query, {
        replacements: [company_id_fk],
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then((data) => {
        // Render the page when all data retrieval operations are complete
        res.render("Pages/pages-projects", {
          projects: data,
          phases: phasesData,
          priorities: prioritiesData,
          sponsors: personsData,
          primes: personsData,
          session: req.session,
        });
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while retrieving data.",
        });
      });
  });
};

// Retrieve all  from the database.
exports.findAll = async (req, res) => {
  try {
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
    console.log("ONE FOR COMPANY_ID", company_id_fk);

    // let phasesData = await Phase.findAll();
    let phasesData = await Phase.findAll();
    let priorities = await Priority.findAll();

    const personsData = await Person.findAll({
      where: {
        company_id_fk: company_id_fk, // Replace `specificCompanyId` with the actual value or variable
      },
    });

    const query =
      "SELECT proj.company_id_fk,proj.id, proj.project_name, proj.start_date, proj.end_date, prime_person.first_name AS prime_first_name, prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name, sponsor_person.last_name AS sponsor_last_name, proj.project_cost, phases.phase_name FROM projects proj LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk LEFT JOIN phases ON phases.id = proj.phase_id_fk WHERE proj.company_id_fk = ?";

    await db.sequelize
      .query(query, {
        replacements: [company_id_fk],
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then((data) => {
        res.render("Pages/pages-projects", {
          projects: data,
          phases: phasesData,
          priorities: priorities,
          sponsors: personsData,
          primes: personsData,
        });
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while retrieving data.",
        });
      });
  } catch (error) {
    console.log("error:", error);
  }
};
exports.findFunnel = async (req, res) => {
  try {
    let company_id_fk;
    const person_id = req.params.id;
    try {
      if (!req.session) {
        res.redirect("/pages-500");
      } else {
        company_id_fk = req.session.company.id;
      }
    } catch (error) {
      console.log("error:", error);
    }
    // Retrieve data from all sources

    let projectData = Project.findAll({
      company_id_fk: company_id_fk,
      pitch_id_fk: 1,
    });

    const personsData = await Person.findAll({
      where: {
        company_id_fk: company_id_fk, // Replace `specificCompanyId` with the actual value or variable
      },
    });
    console.log(
      "personsData::::::::::::::::::::::::::::::::::::::",
      personsData,
    );
    const query = `
  SELECT 
    proj.company_id_fk, 
    proj.id, 
    proj.project_name, 
    proj.start_date, 
    proj.end_date,
    proj.health, 
    proj.effort AS effort, 
    prime_person.first_name AS prime_first_name,
    prime_person.last_name AS prime_last_name, 
    sponsor_person.first_name AS sponsor_first_name,
    sponsor_person.last_name AS sponsor_last_name, 
    proj.project_cost, 
    phases.phase_name 
  FROM 
    projects proj
  LEFT JOIN 
    persons prime_person ON prime_person.id = proj.prime_id_fk
  LEFT JOIN 
    persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk
  LEFT JOIN 
    phases ON phases.id = proj.phase_id_fk
  WHERE 
    proj.company_id_fk = ? 
    AND (proj.prime_id_fk IS NOT NULL OR proj.sponsor_id_fk IS NOT NULL)
  ORDER BY 
    proj.phase_id_fk;
`;
    console.log("personsData:::::::::::::::", personsData);
    await db.sequelize
      .query(query, {
        replacements: [company_id_fk],
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then((data) => {
        res.render("Pages/pages-projects", {
          projects: data,
          phases: phasesData,
          priorities: prioritiesData,
          sponsors: personsData,
          primes: personsData,
        });
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while retrieving data.",
        });
      });
  } catch (error) {
    console.log("error:", error);
  }
};
// Find a single Project with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  if (id) {
    Project.findByPk(id)
      .then((data) => {
        if (data) {
          res.status(200).send(data);
        } else {
          res.status(404).send({
            message: `Cannot find Project with id=${id}.`,
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          message: "Error retrieving Project with id=" + id,
        });
      });
  }
};
exports.cockpit = async (req, res) => {
  console.log("cockpit:", req.params.id);
  const project_id = req.params.id;

  let company_id_fk;
  try {
    if (!req.session) {
      return res.redirect("/pages-500");
    } else {
      company_id_fk = req.session.company.id;
    }
  } catch (error) {
    console.log("error:", error);
    return res.redirect("/pages-500");
  }

  //COCKPIT QUERY
  try {
    const query = `
        SELECT 
            proj.company_id_fk,
            proj.id, 
            proj.project_name, 
            proj.project_headline,
            proj.start_date, 
            proj.end_date,
            proj.effort,
            proj.project_why,
            proj.project_what,
            prime_person.first_name AS prime_first_name, 
            prime_person.last_name AS prime_last_name, 
            sponsor_person.first_name AS sponsor_first_name, 
            sponsor_person.last_name AS sponsor_last_name, 
            proj.project_cost, 
            proj.tags,
            phases.phase_name,
            proj.prime_id_fk
        FROM projects proj 
        LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk 
        LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk 
        LEFT JOIN phases ON phases.id = proj.phase_id_fk 
        WHERE proj.company_id_fk = ? AND proj.id = ?`;

    const data = await db.sequelize.query(query, {
      replacements: [company_id_fk, project_id],
      type: db.sequelize.QueryTypes.SELECT,
    });
    console.log("get logs");
    try {
      const changed_project = await db.changed_projects.findAll({
        where: {
          project_id_fk: project_id,
          company_id_fk: company_id_fk,
        },
        order: [["change_date", "DESC"]],
      });
    } catch (error) {
      console.log("!!!!!!Error:", error);
    }

    const statuses = await Status.findAll({
      where: {
        project_id_fk: project_id,
      },
      order: [["status_date", "DESC"]],
    });
    let lastStatusDate = null;
    let statusColor = null;
    if (statuses) {
      if (statuses.length > 0) {
        lastStatusDate = statuses[0].status_date;
        statusColor = statuses[0].health;
      } else {
        console.log("no status");
        lastStatusDate = "N/A";
        statusColor = "green";
      }
    }
    res.render("Pages/pages-cockpit", {
      project: data,
      current_date: currentDate,
      formattedCost: data[0].project_cost,

      statuses: statuses,
      lastStatusDate: lastStatusDate,
      statusColor: statusColor,
    });
  } catch (error) {
    console.log("Database Query Error: ", error);
    res.status(500).send({
      message: "An error occurred while retrieving project data.",
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
     SELECT 
      proj.company_id_fk,
      proj.id,
      proj.project_name,
	    proj.project_headline,
      proj.start_date,
      proj.end_date,
	    proj.next_milestone_date,
	    proj.project_why,
	    proj.project_what,
	    proj.phase_id_fk,	
      proj.prime_id_fk,
      proj.priority_id_fk,
      proj.impact,
      proj.complexity,
      proj.effort,
      proj.benefit,
      proj.project_cost,
      proj.tags
FROM 
    projects proj
LEFT JOIN 
    persons prime_person ON prime_person.id = proj.prime_id_fk
LEFT JOIN 
    persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk
LEFT JOIN 
    phases ON phases.id = proj.phase_id_fk
WHERE 
proj.company_id_fk = ? AND proj.id = ?`;

    try {
      // Execute the query
      const data = await db.sequelize.query(query, {
        replacements: [company_id_fk, project_id],
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (!data || data.length === 0) {
        return res.status(404).send({ message: "Project not found" });
      }

      // Get reasons for change for the project
      const change_reasons = await ChangeReason.findAll({
        company_id_fk: company_id_fk,
      });
      let lastStartDate = null;
      // Get statuses for the project
      const statuses = await Status.findAll({
        where: { project_id_fk: project_id },
        order: [["status_date", "DESC"]],
      });
      if (statuses.length > 0) {
        lastStartDate = statuses[0].status_date;
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
          company_id_fk: company_id_fk, // Replace `specificCompanyId` with the actual value or variable
        },
      });
      res.render("Pages/pages-edit-project", {
        project: data[0], // Pass the first element of the data array
        current_date: currentDate,
        formattedCost: data[0].project_cost,
        phases: phasesData,
        priorities: prioritiesData,
        sponsors: personsData,
        primes: personsData,
        change_reasons,
      });
    } catch (err) {
      console.error("Error retrieving data:", err);
      res.status(500).send({
        message: err.message || "Error occurred while retrieving data.",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      message: "An unexpected error occurred.",
    });
  }
};
// exports.findAllPrimeProjects = async (req, res) => {
//   try {
//     let company_id_fk;

//     const person_id = req.params.id;

//     try {
//       if (!req.session) {
//         res.redirect("/pages-500");
//       } else {
//         company_id_fk = req.session.company.id;
//       }
//     } catch (error) {
//       console.log("error:", error);
//     }

//     const [phasesData, prioritiesData] = await Promise.all([
//       Phase.findAll(),
//       Priority.findAll(),
//       // Results will be an empty array and metadata will contain the number of affected rows.

//       Project.findAll(), // Assuming Project.findAll() returns a Promise
//     ]);
//     const personsData = await Person.findAll({
//       where: {
//         company_id_fk: company_id_fk, // Replace `specificCompanyId` with the actual value or variable
//       },
//     });

//     const query = `
//     SELECT
//         proj.company_id_fk,
//         proj.id,
//         proj.project_name,
//         proj.start_date,
//         proj.end_date,
//         proj.prime_id_fk,
//         prime_person.first_name AS prime_first_name,
//         prime_person.last_name AS prime_last_name,
//         sponsor_person.first_name AS sponsor_first_name,
//         sponsor_person.last_name AS sponsor_last_name,
//         proj.project_cost,
//         phases.phase_name
//     FROM
//         projects proj
//     LEFT JOIN
//         persons prime_person ON prime_person.id = proj.prime_id_fk
//     LEFT JOIN
//         persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk
//     LEFT JOIN
//         phases ON phases.id = proj.phase_id_fk
//     WHERE
//         proj.company_id_fk = ?
//         AND proj.person_id_fk = ?
//         AND prime_person.id = proj.prime_id_fk OR sponsor_person.id = proj.sponsor_id_fk
// `;

//     await db.sequelize
//       .query(query, {
//         replacements: [company_id_fk, person_id],
//         type: db.sequelize.QueryTypes.SELECT,
//       })
//       .then((data) => {
//         // console.log("***************************************************:",data)
//         // Render the page when all data retrieval operations are complete
//         //dah
//         res.render("Pages/pages-projects", {
//           projects: data,
//           phases: phasesData,
//           priorities: prioritiesData,
//           sponsors: personsData,
//           primes: personsData,
//         });
//       })
//       .catch((err) => {
//         res.status(500).send({
//           message: err.message || "Some error occurred while retrieving data.",
//         });
//       });
//   } catch (error) {
//     console.log("error:", error);
//   }
// };
exports.findOneForPrime = async (req, res) => {
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
             proj.project_what,proj.tags,proj.effort, proj.impact, proj.complexity, prime_person.first_name AS prime_first_name, 
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
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (!data || data.length === 0) {
        return res.status(404).send({ message: "Project not found" });
      }

      // Get reasons for change for the project
      const change_reasons = await ChangeReason.findAll({
        company_id_fk: company_id_fk,
      });
      // let lastStartDate = null;
      // let lastEndDate = null;
      // let milestoneDate = null;
      // let lastStatusDate = null;
      // let statusColor = null;

      // Get statuses for the project
      const statuses = await Status.findAll({
        where: { project_id_fk: project_id },
        order: [["status_date", "DESC"]],
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
          company_id_fk: company_id_fk, // Replace `specificCompanyId` with the actual value or variable
        },
      });
      res.render("Pages/pages-edit-project", {
        project: data[0], // Pass the first element of the data array
        current_date: currentDate,
        formattedCost: data[0].project_cost,
        phases: phasesData,
        priorities: prioritiesData,
        sponsors: personsData,
        primes: personsData,
        change_reasons,
      });
    } catch (err) {
      console.error("Error retrieving data:", err);
      res.status(500).send({
        message: err.message || "Error occurred while retrieving data.",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      message: "An unexpected error occurred.",
    });
  }
};
exports.findFunnel = async (req, res) => {
  try {
    const company_id_fk = req.session.company.id;

    // Retrieve phases
    const phases = await Phase.findAll();

    // Retrieve projects related to the company
    const projects = await Project.findAll({
      where: { company_id_fk: company_id_fk, phase_id_fk: 1 },
    });

    // Calculate pitch count, total cost, and total effort
    const pitchCount = projects.length;
    let pitchTotalCost = 0;
    let pitchTotalPH = 0;

    projects.forEach((project) => {
      pitchTotalCost += parseFloat(project.project_cost) || 0;
      pitchTotalPH += parseFloat(project.effort) || 0;
    });

    // Render the funnel page with the retrieved data
    res.render("Pages/pages-funnel", {
      phases: phases,
      projects: projects,
      pitchCount: pitchCount,
      pitchTotalCost: pitchTotalCost,
      pitchTotalPH: pitchTotalPH,
    });
  } catch (error) {
    console.error("Error finding funnel:", error);
    res.status(500).json({ message: "Error finding funnel" });
  }
};
// exports.findFunnel = async (req, res) => {
//   try {
//     let company_id_fk;
//     const person_id = req.params.id;

//     try {
//       if (!req.session) {
//         res.redirect("/pages-500");
//       } else {
//         console.log("we have a session");
//         company_id_fk = req.session.company.id;
//       }
//     } catch (error) {
//       console.log("error:", error);
//     }

//     const [phasesData, prioritiesData, projectsData] = await Promise.all([
//       Phase.findAll(),
//       Priority.findAll(),
//       // Results will be an empty array and metadata will contain the number of affected rows.

//       Project.findAll(), // Assuming Project.findAll() returns a Promise
//     ]);
//     const personsData = await Person.findAll({
//       where: {
//         company_id_fk: company_id_fk, // Replace `specificCompanyId` with the actual value or variable
//       },
//     });

//     const query = `
//     SELECT
//         proj.company_id_fk,
//         proj.id,
//         proj.project_name,
//         proj.start_date,
//         proj.end_date,
//         proj.prime_id_fk,
//         prime_person.first_name AS prime_first_name,
//         prime_person.last_name AS prime_last_name,
//         sponsor_person.first_name AS sponsor_first_name,
//         sponsor_person.last_name AS sponsor_last_name,
//         proj.project_cost,
//         phases.phase_name
//     FROM
//         projects proj
//     LEFT JOIN
//         persons prime_person ON prime_person.id = proj.prime_id_fk
//     LEFT JOIN
//         persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk
//     LEFT JOIN
//         phases ON phases.id = proj.phase_id_fk
//     WHERE
//         proj.company_id_fk = ?
//         AND proj.person_id_fk = ?
//         AND prime_person.id = proj.prime_id_fk OR sponsor_person.id = proj.sponsor_id_fk
// `;

//     await db.sequelize
//       .query(query, {
//         replacements: [company_id_fk, person_id],
//         type: db.sequelize.QueryTypes.SELECT,
//       })
//       .then((data) => {
//         // console.log("***************************************************:",data)
//         // Render the page when all data retrieval operations are complete
//         //dah
//         res.render("Pages/pages-projects", {
//           projects: data,
//           phases: phasesData,
//           priorities: prioritiesData,
//           sponsors: personsData,
//           primes: personsData,
//         });
//       })
//       .catch((err) => {
//         res.status(500).send({
//           message: err.message || "Some error occurred while retrieving data.",
//         });
//       });
//   } catch (error) {
//     console.log("error:", error);
//   }
// };
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
    SUM(CASE WHEN phase_id_fk = 1 THEN 1 ELSE 0 END) AS phase_1_count,
    SUM(CASE WHEN phase_id_fk = 2 THEN 1 ELSE 0 END) AS phase_2_count,
    SUM(CASE WHEN phase_id_fk = 3 THEN 1 ELSE 0 END) AS phase_3_count,
    SUM(CASE WHEN phase_id_fk = 4 THEN 1 ELSE 0 END) AS phase_4_count,
    SUM(CASE WHEN phase_id_fk = 5 THEN 1 ELSE 0 END) AS phase_5_count,
    SUM(CASE WHEN phase_id_fk = 1 THEN CAST(TRIM(REPLACE(project_cost, ',', '')) AS NUMERIC) ELSE 0 END) AS phase_1_total_cost,
    SUM(CASE WHEN phase_id_fk = 2 THEN CAST(TRIM(REPLACE(project_cost, ',', '')) AS NUMERIC) ELSE 0 END) AS phase_2_total_cost,
    SUM(CASE WHEN phase_id_fk = 3 THEN CAST(TRIM(REPLACE(project_cost, ',', '')) AS NUMERIC) ELSE 0 END) AS phase_3_total_cost,
    SUM(CASE WHEN phase_id_fk = 4 THEN CAST(TRIM(REPLACE(project_cost, ',', '')) AS NUMERIC) ELSE 0 END) AS phase_4_total_cost,
    SUM(CASE WHEN phase_id_fk = 5 THEN CAST(TRIM(REPLACE(project_cost, ',', '')) AS NUMERIC) ELSE 0 END) AS phase_5_total_cost
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
    const pitchCount = Number(data[0].phase_1_count);
    const priorityCount = Number(data[0].phase_2_count);
    const discoveryCount = Number(data[0].phase_3_count);
    const deliveryCount = Number(data[0].phase_3_count);
    const operationsCount = Number(data[0].phase_4_count);
    const pitchTotalCost = Number(data[0].phase_1_total_cost) || 0;
    const priorityTotalCost = Number(data[0].phase_2_total_cost) || 0;
    const discoveryCost = Number(data[0].phase_3_total_cost) || 0;
    const deliveryTotalCost = Number(data[0].phase_4_total_cost) || 0;
    const operationsTotalCost = Number(data[0].phase_5_total_cost) || 0;
    const totalCost =
      pitchTotalCost +
      priorityTotalCost +
      discoveryCost +
      deliveryTotalCost +
      operationsTotalCost;
    const usedCost = totalCost - operationsTotalCost;
    const avalCost = totalCost - usedCost;
    const in_flight_count = priorityTotalCost + discoveryCount + deliveryCount;
    const in_flight_cost =
      priorityTotalCost + discoveryCost + deliveryTotalCost;
    // console.log("flight count:",Number(in_flight_count) || 0);

    res.render("Pages/pages-radar", {
      pitchCount,
      priorityCount,
      discoveryCount,
      operationsCount: in_flight_count,
      pitchCost: pitchTotalCost,
      priorityCost: priorityTotalCost,
      in_flight_count: in_flight_count,
      operationsCost: data[0].phase_5_count,
      // phase_2_total_cost: data[0].phase_2_total_cost,
      in_flight_cost: in_flight_cost,
      operationsCount,
      operationsTotalCost,
      totalCost,
      usedCost,
      avalCost,
      deliveryCount,
      deliveryCost: deliveryTotalCost,
      discoveryCost: deliveryTotalCost,
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
    const startDateTest = insertValidDate(data.start_date);
    // Pass the result to the EJS template
    res.render("Pages/pages-flight-plan", {
      start_date: startDateTest,
      health_data: data,
    });
  } catch (error) {
    console.log("Query error:", error);
    return res.status(500).send({ message: "Server error" });
  }
};
// Define the findFunnel function
exports.findFunnel = async (req, res) => {
  try {
    if (!req.session || !req.session.company || !req.session.person) {
      return res.redirect("/pages-500");
    }

    const company_id_fk = req.session.company.id;
    const person_id_fk = req.session.person.id;

    console.log("COMPANY::", company_id_fk);
    console.log("PERSON::", person_id_fk);

    // Custom SQL query to retrieve project data
    const query = `
      SELECT 
        proj.company_id_fk,
        proj.id,
        proj.project_name,
        proj.start_date,
        proj.end_date,
        proj.health,
        proj.effort AS effort,
        prime_person.first_name AS prime_first_name,
        prime_person.last_name AS prime_last_name,
        sponsor_person.first_name AS sponsor_first_name,
        sponsor_person.last_name AS sponsor_last_name,
        proj.project_cost,
        phases.phase_name 
      FROM 
        projects proj
      LEFT JOIN 
        persons prime_person ON prime_person.id = proj.prime_id_fk
      LEFT JOIN 
        persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk
      LEFT JOIN 
        phases ON phases.id = proj.phase_id_fk
      WHERE 
        proj.company_id_fk = ? AND (proj.prime_id_fk = ? OR proj.sponsor_id_fk = ?)
    `;

    const data = await db.sequelize.query(query, {
      replacements: [company_id_fk, person_id_fk, person_id_fk],
      type: db.sequelize.QueryTypes.SELECT,
    });

    console.log("get logs");

    // Calculate pitch count, total cost, and total effort
    const pitchCount = data.length;
    let pitchTotalCost = 0;
    let pitchTotalPH = 0;

    data.forEach((project) => {
      pitchTotalCost += parseFloat(project.project_cost) || 0;
      pitchTotalPH += parseFloat(project.effort) || 0;
    });

    // Retrieve phases and priorities
    const phases = await Phase.findAll();
    const priorities = await Priority.findAll();

    // Retrieve sponsors and primes
    const persons = await Person.findAll({
      where: { company_id_fk: company_id_fk },
    });

    const sponsors = persons.filter((person) => person.role === "sponsor");
    const primes = persons.filter((person) => person.role === "prime");

    // Render the funnel page with the retrieved data
    res.render("Pages/pages-funnel", {
      phases: phases,
      priorities: priorities,
      projects: data,
      pitchCount: pitchCount,
      pitchTotalCost: pitchTotalCost,
      pitchTotalPH: pitchTotalPH,
      sponsors: sponsors,
      primes: primes,
      // other data you need to pass to the template
    });
  } catch (error) {
    console.error("Error finding funnel:", error);
    res.status(500).json({ message: "Error finding funnel" });
  }
};
exports.health = async (req, res) => {
  //
  res.render("Pages/pages-health");
};

// Update a Project by the id in the request
exports.update = async (req, res) => {
  try {
    // Ensure session exists and fetch company ID
    const id = req.params.id;
    if (!req.session || !req.session.company) {
      return res.redirect("/pages-500");
    }
    const company_id_fk = req.session.company.id;

    // Initialize startDate, endDate, and nextMilestoneDate
    let startDate = null;
    let endDate = null;
    let nextMilestoneDate = null;

    // Check if start_date has a value and is not null
    if (req.body.start_date) {
      startDate = moment
        .tz(req.body.start_date, "YYYY-MM-DD", "UTC")
        .set({ hour: 20, minute: 0, second: 0 });
      if (!startDate.isValid()) {
        console.log("Invalid Start Date:", req.body.start_date);
        return res.status(400).send("Invalid Start Date");
      }
      console.log("Start Date:", startDate.format("YYYY-MM-DD HH:mm:ssZ"));
    } else {
      console.log("Start Date is missing or null");
    }

    // Check if end_date has a value and is not null
    if (req.body.end_date) {
      endDate = moment
        .tz(req.body.end_date, "YYYY-MM-DD", "UTC")
        .set({ hour: 20, minute: 0, second: 0 });
      if (!endDate.isValid()) {
        console.log("Invalid End Date:", req.body.end_date);
        return res.status(400).send("Invalid End Date");
      }
      console.log("End Date:", endDate.format("YYYY-MM-DD HH:mm:ssZ"));
    } else {
      console.log("End Date is missing or null");
    }

    // Check if next_milestone_date has a value and is not null
    if (req.body.next_milestone_date) {
      nextMilestoneDate = moment
        .tz(req.body.next_milestone_date, "YYYY-MM-DD", "UTC")
        .set({ hour: 20, minute: 0, second: 0 });
      if (!nextMilestoneDate.isValid()) {
        console.log(
          "Invalid Next Milestone Date:",
          req.body.next_milestone_date,
        );
        return res.status(400).send("Invalid Next Milestone Date");
      }
      console.log(
        "Next Milestone Date:",
        nextMilestoneDate.format("YYYY-MM-DD HH:mm:ssZ"),
      );
    } else {
      console.log("Next Milestone Date is missing or null");
    }

    // Update the project in the database
    await Project.update(
      {
        start_date: startDate ? startDate.toDate() : null,
        end_date: endDate ? endDate.toDate() : null,
        next_milestone_date: nextMilestoneDate
          ? nextMilestoneDate.toDate()
          : null,
        company_id_fk: company_id_fk,
        project_name: req.body.project_name,
        project_headline: req.body.project_headline,
        project_description: req.body.project_description,
        project_why: req.body.project_why,
        project_what: req.body.project_what,
        priority_id_fk: req.body.priority_id_fk,
        sponsor_id_fk: req.body.sponsor_id_fk,
        prime_id_fk: req.body.prime_id_fk,
        impact: req.body.impact,
        complexity: req.body.complexity,
        effort: req.body.effort,
        benefit: req.body.benefit,
        project_cost: req.body.project_cost,
        tags: req.body.tags,
      },
      {
        where: { id: id, company_id_fk: company_id_fk },
      },
    );

    res.redirect("/projects/");
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Error updating project" });
  }
};
// Delete a Project with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Project.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
      } else {
        res.send({
          message: `Cannot delete Project with id=${id}. Maybe Project was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Project with id=" + id,
      });
    });
};

// Delete all  from the database.
exports.deleteAll = (req, res) => {
  Project.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      res.send({ message: `${nums} Companies were deleted successfully!` });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all companies.",
      });
    });
};
function insertValidDate(dateString) {
  try {
    const date = new Date(dateString);
    // Format the date to "YYYY-MM-DD"
    const formattedDate = date.toISOString().split("T")[0];
    console.log(formattedDate); // Output: "2024-12-31"
    return formattedDate;
  } catch (error) {
    console.log("Error:", error);
    return null;
  }
}
