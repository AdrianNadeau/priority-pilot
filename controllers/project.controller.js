const db = require("../models");
const Project = db.projects;
const Phase = db.phases;
const Priority = db.priorities;
const Person = db.persons;
const ChangeLog = db.change_logs;
const ChangeReason = db.change_reasons;
const ChangeProject = db.changed_projects;
const Tag = db.tags;
const Status = db.statuses;
const sequelize = require("sequelize");
const Op = db.Sequelize.Op;
const currentDate = new Date();
const moment = require("moment");
const pg = require("pg");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
// const sendEmail = require("../utils/emailSender");
const { Parser } = require("json2csv");
const puppeteer = require("puppeteer");
const fs = require("fs");
const { jsPDF } = require("jspdf");

// Create and Save a new Project
exports.create = (req, res) => {
  const funnelPage = req.body.funnelPage;
  company_id_fk = req.session.company.id;

  // Convert dates
  let startDateTest = null;
  let endDateTest = null;
  let nextMilestoneDateTest = null;
  let pitch_message = "";
  let projectCost = null;

  startDateTest = insertValidDate(req.body.start_date);
  endDateTest = insertValidDate(req.body.end_date);
  nextMilestoneDateTest = insertValidDate(req.body.next_milestone_date);
  try {
    projectCost = removeCommasAndConvertToNumber(req.body.project_cost);
  } catch (error) {
    projectCost = 0;
  }
  if (isNaN(projectCost)) {
    projectCost = 0;
  }

  // Create a Project
  const project = {
    company_id_fk: company_id_fk,
    project_name: req.body.project_name,
    project_headline: req.body.headline,
    project_description: req.body.project_description,
    project_why: req.body.why,
    project_what: req.body.what,
    start_date: startDateTest,
    end_date: endDateTest,
    next_milestone_date: nextMilestoneDateTest,
    priority_id_fk: req.body.priority_id_fk,
    sponsor_id_fk: req.body.sponsor_id_fk,
    prime_id_fk: req.body.prime_id_fk,
    phase_id_fk: req.body.phase_id_fk,
    project_cost: removeCommasAndConvertToNumber(req.body.project_cost) || 0,
    effort: removeCommasAndConvertToNumber(req.body.effort) || 0,
    benefit: removeCommasAndConvertToNumber(req.body.benefit) || 0,
    impact: removeCommasAndConvertToNumber(req.body.impact) || 0,
    complexity: removeCommasAndConvertToNumber(req.body.complexity) || 0,
    pitch_message: pitch_message,
    tag_1: req.body.tag_1,
    tag_2: req.body.tag_2,
    tag_3: req.body.tag_3,
    reference: req.body.reference,
  };

  // Save Project in the database
  Project.create(project).then(async (createdProject) => {
    const phasesData = await Phase.findAll({ order: [["id", "ASC"]] }).catch(
      (error) => {
        console.log("Error fetching phasesData:", error);
      },
    );

    const newChangedProject = {
      company_id_fk,
      project_id_fk: createdProject.id,
      project_name: createdProject.project_name,
      project_headline: createdProject.headline,
      project_description: createdProject.project_description,
      project_why: createdProject.why,
      project_what: createdProject.what,
      start_date: startDateTest,
      end_date: endDateTest,
      next_milestone_date: nextMilestoneDateTest,
      priority_id_fk: createdProject.priority_id_fk,
      sponsor_id_fk: createdProject.sponsor_id_fk,
      prime_id_fk: createdProject.prime_id_fk,
      phase_id_fk: createdProject.phase_id_fk,
      project_cost: createdProject.project_cost,
      effort: createdProject.effort,
      benefit: createdProject.benefit,
      impact: createdProject.impact,
      complexity: createdProject.complexity,
      pitch_message: pitch_message,
      tag_1: createdProject.tag_1,
      tag_2: createdProject.tag_2,
      tag_3: createdProject.tag_3,
      change_reason_id_fk: 1,
      change_explanation: "Initial Entry",
    };

    const changedProject = await ChangeProject.create(newChangedProject);

    let tagsData = await Tag.findAll({
      where: {
        [Op.or]: [{ company_id_fk: company_id_fk }, { company_id_fk: 0 }],
      },
      order: [["id", "ASC"]],
    });

    // Add "None" option at the top of the tags list
    tagsData = [{ id: 0, tag_name: "None" }, ...tagsData];

    const [prioritiesData, personsData, projectsData] = await Promise.all([
      Priority.findAll(),
      Person.findAll({
        where: {
          company_id_fk: company_id_fk,
        },
      }),
      Project.findAll(),
    ]);

    if (funnelPage == "n") {
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
            priorities: prioritiesData,
            sponsors: personsData,
            primes: personsData,
            tags: tagsData,
            company_id: company_id_fk,
          });
        })
        .catch((err) => {
          res.status(500).send({
            message:
              err.message || "Some error occurred while retrieving data.",
          });
        });
    } else {
      res.redirect("/projects/funnel/view/");
    }
  });
};

exports.findAllRadar = async (req, res) => {
  const type = req.params.type;

  // Get company id from session

  const company_id_fk = req.session.company.id;

  // Get all company projects with the latest status health
  try {
    const projects = await Project.findAll({
      where: { company_id_fk: company_id_fk },
    });

    // Get the most recent status for each project
    const statuses = await db.statuses.findAll({
      attributes: ["project_id_fk", "health", "status_date", "progress"],
      where: {
        status_date: {
          [db.Sequelize.Op.eq]: db.Sequelize.literal(
            "(SELECT MAX(status_date) FROM statuses WHERE project_id_fk = statuses.project_id_fk)",
          ),
        },
      },
      raw: true, // Ensures raw results are returned
    });
    // get tags for reports
    // Create a map of project_id to status
    const statusMap = {};
    statuses.forEach((status) => {
      statusMap[status.project_id_fk] = status;
    });

    // Add the most recent status to each project
    const projectsWithStatus = projects.map((project) => {
      const projectData = project.toJSON();
      projectData.latest_status = statusMap[project.id] || null;

      projectData.health = statusMap[project.id] || null;
      return projectData;
    });
    const portfolioName = await returnPortfolioName(company_id_fk);
    res.status(200).json(projectsWithStatus, portfolioName);
  } catch (error) {
    console.log("Error retrieving projects:", error);
    res.status(500).json({ message: "Error retrieving projects." });
  }
};
// Retrieve all  from the database.
exports.findAll = async (req, res) => {
  try {
    const company_id_fk = req.session.company.id;

    const phasesData = await Phase.findAll({
      order: [["id", "ASC"]],
    });
    let priorities = await Priority.findAll();

    const personsData = await Person.findAll({
      where: {
        company_id_fk: company_id_fk, // Replace `specificCompanyId` with the actual value or variable
      },
    });
    // Fetch tags
    let tagsData = await Tag.findAll({
      where: {
        [Op.or]: [{ company_id_fk: company_id_fk }, { company_id_fk: 0 }],
      },
      order: [["id", "ASC"]],
    });

    // Add "None" option at the top of the tags list
    tagsData = [{ id: 0, tag_name: "None" }, ...tagsData];
    const query = `
  SELECT 
    proj.company_id_fk,
    proj.id,
    proj.project_name,
    proj.start_date,
    proj.end_date,
    prime_person.first_name AS prime_first_name,
    prime_person.last_name AS prime_last_name,
    sponsor_person.first_name AS sponsor_first_name,
    sponsor_person.last_name AS sponsor_last_name,
    proj.project_cost,
    proj.effort,
    proj.benefit,
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
    AND proj.phase_id_fk NOT IN (1, 6)
  ORDER BY proj.project_name ASC;
`;
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
          tags: tagsData,
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
  const project_id = req.params.id;
  const company_id_fk = req.session.company.id;
  let tagsData = await Tag.findAll({
    where: {
      [Op.or]: [{ company_id_fk: company_id_fk }, { company_id_fk: 0 }],
    },
    order: [["id", "ASC"]],
  });
  //COCKPIT QUERY
  try {
    const query = `
    SELECT 
      proj.tag_1,
      tag1.tag_name AS tag_1_name,
      proj.tag_2,
      tag2.tag_name AS tag_2_name,
      proj.tag_3,
      tag3.tag_name AS tag_3_name,
      proj.company_id_fk,
      proj.id, 
      proj.project_name, 
      proj.project_headline,
      proj.start_date, 
      proj.end_date,
      proj.next_milestone_date,
      proj.effort,
      proj.project_why,
      proj.project_what,
      proj.reference,
      prime_person.first_name AS prime_first_name, 
      prime_person.last_name AS prime_last_name, 
      sponsor_person.first_name AS sponsor_first_name, 
      sponsor_person.last_name AS sponsor_last_name, 
      proj.project_cost, 
      phases.phase_name,
      proj.prime_id_fk,
      proj.benefit,
      proj.phase_id_fk
    FROM projects proj 
    LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk 
    LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk 
    LEFT JOIN phases ON phases.id = proj.phase_id_fk 
    LEFT JOIN tags tag1 ON tag1.id = proj.tag_1
    LEFT JOIN tags tag2 ON tag2.id = proj.tag_2
    LEFT JOIN tags tag3 ON tag3.id = proj.tag_3
    WHERE proj.company_id_fk = ? AND proj.id = ?
    `;

    const data = await db.sequelize.query(query, {
      replacements: [company_id_fk, project_id],
      type: db.sequelize.QueryTypes.SELECT,
    });

    let changed_projects;
    try {
      changed_projects = await db.changed_projects.findAll({
        where: {
          project_id_fk: project_id,
        },
        order: [["createdAt", "DESC"]],
      });
    } catch (error) {
      console.log("Cockpit Changed Projects error:", error);
    }

    const statuses = await Status.findAll({
      where: { project_id_fk: project_id },
      order: [["status_date", "DESC"]],
    });
    let lastStatusDate = null;
    let statusColor = null;
    if (statuses) {
      if (statuses.length > 0) {
        lastStatusDate = statuses[0].status_date;
        statusColor = statuses[0].health;
      } else {
        lastStatusDate = "";
        statusColor = "green";
      }
    }

    let tagsData = await Tag.findAll({
      where: {
        [Op.or]: [{ company_id_fk: company_id_fk }, { company_id_fk: 0 }],
      },
      order: [["id", "ASC"]],
    });

    // In your controller before rendering the page:
    const changeReasons = await ChangeReason.findAll();
    const changeReasonMap = {};
    changeReasons.forEach((r) => {
      changeReasonMap[r.id] = r.change_reason;
    });
    res.render("Pages/pages-cockpit", {
      project: data,
      current_date: currentDate,
      formattedCost: data[0].project_cost,
      statuses: statuses,
      statusColor: statusColor,
      changed_projects,
      changeReasonMap,
      // tags: tagsData,
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
    let startDateTest = null,
      endDateTest = null,
      nextMilestoneDateTest = null;

    company_id_fk = req.session.company.id;
    // Query to fetch project details
    const query = `
     SELECT 
      proj.tag_1, 
      proj.tag_2, 
      proj.tag_3,
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
      proj.sponsor_id_fk,
      proj.priority_id_fk,
      proj.impact,
      proj.complexity,
      proj.effort,
      proj.benefit,
      proj.project_cost,
      proj.tag_1,
      proj.tag_2,
      proj.tag_3,
      proj.reference
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
      //format dates for pickers
      try {
        startDateTest = moment.utc(data[0].start_date).format("YYYY-MM-DD");
        endDateTest = moment.utc(data[0].end_date).format("YYYY-MM-DD");
        nextMilestoneDateTest = moment
          .utc(data[0].next_milestone_date)
          .format("YYYY-MM-DD");
      } catch (error) {
        startDateTest = null;
        endDateTest = null;
        nextMilestoneDateTest = null;
      }
      // Get reasons for change for the project
      const change_reasons = await ChangeReason.findAll({
        where: {
          id: {
            [Op.ne]: 1, // Exclude records where id is equal to 1
          },
        },
      });
      let tagsData = await Tag.findAll({
        where: {
          [Op.or]: [{ company_id_fk: company_id_fk }, { company_id_fk: 0 }],
        },
        order: [["id", "ASC"]],
      });
      let lastStartDate = null;
      // Get statuses for the project
      const statuses = await Status.findAll({
        where: { project_id_fk: project_id, status_date: { [Op.ne]: null } },
        order: [["status_date", "DESC"]],
      });
      if (statuses.length > 0) {
        lastStartDate = statuses[0].status_date;
        statusColor = statuses[0].health;
      }
      const phasesData = await Phase.findAll({
        order: [["id", "ASC"]],
      });
      const [prioritiesData] = await Promise.all([
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
        tags: tagsData,
        startDateTest: startDateTest,
        endDateTest: endDateTest,
        nextMilestoneDateTest: nextMilestoneDateTest,
      });
    } catch (err) {
      console.error("Error retrieving data:", err);
      res.status(500).send({
        message: err.message || "Error occurred while retrieving data.",
      });
    }
    let formattedTag;
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      message: "An unexpected error occurred.",
    });
  }
};

exports.findOneForPrime = async (req, res) => {
  const project_id = req.params.id;
  const company_id_fk = req.session.company.id;

  // Query to fetch project details
  const query = `
     SELECT proj.company_id_fk, proj.id, proj.effort, proj.benefit, proj.prime_id_fk, 
             proj.project_headline, proj.project_name, proj.project_description, proj.start_date, 
             proj.end_date, proj.next_milestone_date, proj.project_why, 
             proj.project_what, proj.effort, proj.impact, proj.complexity, prime_person.first_name AS prime_first_name, 
             prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name, 
             sponsor_person.last_name AS sponsor_last_name, proj.project_cost, 
             phases.phase_name, proj.pitch_message, proj.phase_id_fk, proj.priority_id_fk, proj.sponsor_id_fk, proj.prime_id_fk
      FROM projects proj 
      LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk 
      LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk 
      LEFT JOIN phases ON phases.id = proj.phase_id_fk
      WHERE proj.company_id_fk = ? AND proj.id = ?`;

  const data = await db.sequelize.query(query, {
    replacements: [company_id_fk, project_id],
    type: db.sequelize.QueryTypes.SELECT,
  });

  if (!data || data.length === 0) {
    return res.status(404).send({ message: "Project not found" });
  }

  // Get reasons for change for the project
  const change_reasons = await ChangeReason.findAll({
    where: { company_id_fk: company_id_fk },
  });

  let lastStatusDate = null;
  let statusColor = null;

  // Get statuses for the project
  const statuses = await Status.findAll({
    where: { project_id_fk: project_id },
    order: [["status_date", "DESC"]],
  });

  if (statuses.length > 0) {
    lastStatusDate = statuses[0].status_date;
    statusColor = statuses[0].health;
  }

  const phasesData = await Phase.findAll({
    order: [["id", "ASC"]],
  });

  const prioritiesData = await Priority.findAll();

  let tagsData = await Tag.findAll({
    where: {
      [Op.or]: [{ company_id_fk: company_id_fk }, { company_id_fk: 0 }],
    },
    order: [["id", "ASC"]],
  });

  const personsData = await Person.findAll({
    where: { company_id_fk: company_id_fk },
  });

  res.render("Pages/pages-edit-project", {
    project: data[0],
    current_date: new Date(), // Ensure current date is passed correctly
    formattedCost: data[0].project_cost,
    phases: phasesData,
    priorities: prioritiesData,
    sponsors: personsData,
    primes: personsData,
    change_reasons,
    tags: tagsData,
  });
};

exports.radar = async (req, res) => {
  const companyId = req.session.company.id;

  try {
    // One query: stats per phase, with conditional SUMs for health counts & costs
    const phaseStatsRaw = await db.projects.findAll({
      where: { company_id_fk: companyId },
      attributes: [
        "phase_id_fk",
        // overall
        [db.Sequelize.fn("COUNT", db.Sequelize.col("*")), "projectCount"],
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.cast(
              db.Sequelize.fn(
                "NULLIF",
                db.Sequelize.fn(
                  "REPLACE",
                  db.Sequelize.col("project_cost"),
                  ",",
                  "",
                ),
                "",
              ),
              "NUMERIC",
            ),
          ),
          "totalCost",
        ],
        // Red
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal(
              `CASE WHEN health='Red' 
                THEN 1 ELSE 0 END`,
            ),
          ),
          "redCount",
        ],
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal(
              `CASE WHEN health='Red' 
                THEN CAST(REPLACE(project_cost,',','') AS NUMERIC) 
                ELSE 0 END`,
            ),
          ),
          "redCost",
        ],
        // Yellow
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal(`CASE WHEN health='Yellow' THEN 1 ELSE 0 END`),
          ),
          "yellowCount",
        ],
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal(
              `CASE WHEN health='Yellow' 
                THEN CAST(REPLACE(project_cost,',','') AS NUMERIC)
                ELSE 0 END`,
            ),
          ),
          "yellowCost",
        ],
        // Green
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal(`CASE WHEN health='Green' THEN 1 ELSE 0 END`),
          ),
          "greenCount",
        ],
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal(
              `CASE WHEN health='Green' 
                THEN CAST(REPLACE(project_cost,',','') AS NUMERIC)
                ELSE 0 END`,
            ),
          ),
          "greenCost",
        ],
        // No Status (NULL or empty)
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal(
              `CASE WHEN health IS NULL OR health='' THEN 1 ELSE 0 END`,
            ),
          ),
          "noStatusCount",
        ],
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal(
              `CASE WHEN health IS NULL OR health='' 
                THEN CAST(REPLACE(project_cost,',','') AS NUMERIC)
                ELSE 0 END`,
            ),
          ),
          "noStatusCost",
        ],
      ],
      group: ["phase_id_fk"],
      raw: true,
    });

    // Fetch phase names and company headline
    const [phaseRows, company] = await Promise.all([
      db.phases.findAll({ attributes: ["id", "phase_name"], raw: true }),
      db.companies.findByPk(companyId, {
        attributes: ["company_headline"],
        raw: true,
      }),
    ]);
    if (!company) return res.status(404).send("Company not found");

    const phaseNameMap = Object.fromEntries(
      phaseRows.map((p) => [p.id, p.phase_name]),
    );

    // Turn raw stats into a map by phaseId
    const statsByPhase = Object.fromEntries(
      phaseStatsRaw.map((r) => [r.phase_id_fk, r]),
    );

    // Build the ordered array phaseStats
    const PHASE_ORDER = [1, 2, 3, 4, 5];
    const phaseStats = PHASE_ORDER.map((pid) => {
      const r = statsByPhase[pid] || {};
      return {
        phaseId: pid,
        phaseName: phaseNameMap[pid] || `Phase ${pid}`,
        projectCount: Number(r.projectCount || 0),
        totalCost: Number(r.totalCost || 0),

        troubleCount: Number(r.redCount || 0),
        cautionCount: Number(r.yellowCount || 0),
        healthyCount: Number(r.greenCount || 0),
        noStatusCount: Number(r.noStatusCount || 0),

        troubleCost: Number(r.redCost || 0),
        cautionCost: Number(r.yellowCost || 0),
        healthyCost: Number(r.greenCost || 0),
        noStatusCost: Number(r.noStatusCost || 0),
      };
    });

    // Render just three variables
    res.render("Pages/pages-radar", {
      portfolioName: company.company_headline,
      currentDate: new Date().toLocaleDateString(),
      phaseStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.progress = async (req, res) => {
  const companyId = req.session.company.id;
  try {
    // Get all projects for the company
    const projects = await db.projects.findAll({
      where: { company_id_fk: companyId },
      attributes: ["id", "project_name", "tag_1", "tag_2", "tag_3"],
    });

    if (!projects || projects.length === 0) {
      return res
        .status(404)
        .send({ message: "No projects found for this company." });
    }

    // Get the most recent status for each project
    const projectNames = [];
    const progress = [];
    const tags = { tag_1: [], tag_2: [], tag_3: [] };
    const colors = [];

    for (const project of projects) {
      projectNames.push(project.project_name);

      // Fetch the most recent status for this project
      const status = await db.statuses.findOne({
        where: { project_id_fk: project.id },
        order: [["status_date", "DESC"]],
        attributes: ["progress", "health"],
      });

      progress.push(status ? status.progress : "No status available");
      colors.push(status ? status.health : "No status available");

      // Fetch tag names
      if (project.tag_1) {
        const tag1 = await db.tags.findOne({
          where: { id: project.tag_1 },
          attributes: ["tag_name"],
        });
        if (tag1) tags.tag_1.push(tag1.tag_name);
      }
      if (project.tag_2) {
        const tag2 = await db.tags.findOne({
          where: { id: project.tag_2 },
          attributes: ["tag_name"],
        });
        if (tag2) tags.tag_2.push(tag2.tag_name);
      }
      if (project.tag_3) {
        const tag3 = await db.tags.findOne({
          where: { id: project.tag_3 },
          attributes: ["tag_name"],
        });
        if (tag3) tags.tag_3.push(tag3.tag_name);
      }
    }

    // Send the response
    res.json({
      company_name: req.session.company.company_name,
      project_names: projectNames,
      progress: progress,
      colors: colors,
      tags: tags,
      // portfolioName,
    });
  } catch (error) {
    console.log("Query error:", error);
    return res.status(500).send({ message: "Server error" });
  }
};

exports.countProjectsByTag1 = async (req, res) => {
  let companyId = req.session.company.id;

  try {
    // Count projects grouped by tag_1 and ensure tag_1 is not 0
    const tag1Counts = await db.projects.findAll({
      where: {
        company_id_fk: companyId,
        tag_1: {
          [Op.and]: {
            [Op.ne]: 0, // Ensure tag_1 is not 0
            [Op.ne]: null, // Ensure tag_1 is not null
          },
        },
      },
      attributes: [
        "tag_1",
        [
          db.Sequelize.fn("COUNT", db.Sequelize.col("projects.id")),
          "project_count",
        ],
      ],
      group: ["tag_1"],
      order: [
        [db.Sequelize.fn("COUNT", db.Sequelize.col("projects.id")), "DESC"],
      ],
    });

    // Fetch tag names for each tag_1
    const tag1Names = await db.tags.findAll({
      where: {
        id: {
          [Op.in]: tag1Counts.map((tag) => tag.tag_1),
        },
      },
      attributes: ["id", "tag_name"],
    });

    // Map tag names to tag1Counts

    const tag1CountsWithNames = tag1Counts.map((tag) => {
      const tagName = tag1Names.find((t) => t.id === tag.tag_1);
      return {
        tag_1: tag.tag_1,
        tag_name: tagName ? tagName.tag_name : null,
        project_count: tag.get("project_count"),
      };
    });

    // Send the response
    res.json(tag1CountsWithNames);
  } catch (error) {
    console.log("Query error:", error);
    return res.status(500).send({ message: "Server error" });
  }
};
exports.countCostsByTag1 = async (req, res) => {
  const companyId = req.session.company.id;

  try {
    const tag1Costs = await db.projects.findAll({
      where: {
        company_id_fk: companyId,
        tag_1: {
          [Op.and]: {
            [Op.ne]: 0,
            [Op.ne]: null,
          },
        },
      },
      attributes: [
        "tag_1",
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.cast(
              db.Sequelize.fn(
                "NULLIF",
                db.Sequelize.fn(
                  "REPLACE",
                  db.Sequelize.col("project_cost"),
                  ",",
                  "",
                ),
                "",
              ),
              "NUMERIC",
            ),
          ),
          "total_cost",
        ],
      ],
      group: ["tag_1"],
      order: [
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.cast(
              db.Sequelize.fn(
                "NULLIF",
                db.Sequelize.fn(
                  "REPLACE",
                  db.Sequelize.col("project_cost"),
                  ",",
                  "",
                ),
                "",
              ),
              "NUMERIC",
            ),
          ),
          "DESC",
        ],
      ],
      raw: true,
    });

    const tagIds = tag1Costs.map((r) => r.tag_1);
    const tagRows = await db.tags.findAll({
      where: { id: { [Op.in]: tagIds } },
      attributes: ["id", "tag_name"],
      raw: true,
    });
    const nameMap = Object.fromEntries(tagRows.map((t) => [t.id, t.tag_name]));

    const result = tag1Costs.map((r) => ({
      tag_1: r.tag_1,
      tag_name: nameMap[r.tag_1] || null,
      total_cost: parseFloat(r.total_cost),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error in costProjectsByTag1:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.countEffortByTag1 = async (req, res) => {
  const companyId = req.session.company.id;

  try {
    const tag1Efforts = await db.projects.findAll({
      where: {
        company_id_fk: companyId,
        tag_1: {
          [Op.and]: {
            [Op.ne]: 0,
            [Op.ne]: null,
          },
        },
      },
      attributes: [
        "tag_1",
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.cast(
              db.Sequelize.fn(
                "NULLIF",
                db.Sequelize.fn("REPLACE", db.Sequelize.col("effort"), ",", ""),
                "",
              ),
              "NUMERIC",
            ),
          ),
          "total_effort",
        ],
      ],
      group: ["tag_1"],
      order: [
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.cast(
              db.Sequelize.fn(
                "NULLIF",
                db.Sequelize.fn("REPLACE", db.Sequelize.col("effort"), ",", ""),
                "",
              ),
              "NUMERIC",
            ),
          ),
          "DESC",
        ],
      ],
      raw: true,
    });

    const tagIds = tag1Efforts.map((r) => r.tag_1);
    const tagRows = await db.tags.findAll({
      where: { id: { [Op.in]: tagIds } },
      attributes: ["id", "tag_name"],
      raw: true,
    });
    const nameMap = Object.fromEntries(tagRows.map((t) => [t.id, t.tag_name]));

    const result = tag1Efforts.map((r) => ({
      tag_1: r.tag_1,
      tag_name: nameMap[r.tag_1] || null,
      total_effort: parseFloat(r.total_effort),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error in countEffortByTag1:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.countProjectsByTag2 = async (req, res) => {
  const companyId = req.session.company.id;

  try {
    // Count projects grouped by tag_1 and ensure tag_1 is not 0
    const tag2Counts = await db.projects.findAll({
      where: {
        company_id_fk: companyId,
        tag_1: {
          [Op.and]: {
            [Op.ne]: 0, // Ensure tag_1 is not 0
            [Op.ne]: null, // Ensure tag_1 is not null
          },
        },
      },
      attributes: [
        "tag_2",
        [
          db.Sequelize.fn("COUNT", db.Sequelize.col("projects.id")),
          "project_count",
        ],
      ],
      group: ["tag_2"],
      order: [
        [db.Sequelize.fn("COUNT", db.Sequelize.col("projects.id")), "DESC"],
      ],
    });

    // Fetch tag names for each tag_1
    const tag2Names = await db.tags.findAll({
      where: {
        id: {
          [Op.in]: tag2Counts.map((tag) => tag.tag_2),
        },
      },
      attributes: ["id", "tag_name"],
    });

    // Map tag names to tag3Counts
    const tag2CountsWithNames = tag2Counts.map((tag) => {
      const tagName = tag2Names.find((t) => t.id === tag.tag_2);
      return {
        tag_2: tag.tag_2,
        tag_name: tagName ? tagName.tag_name : null,
        project_count: tag.get("project_count"),
      };
    });

    // Send the response
    res.json(tag2CountsWithNames);
  } catch (error) {
    console.log("Query error:", error);
    return res.status(500).send({ message: "Server error" });
  }
};
exports.countCostsByTag2 = async (req, res) => {
  const companyId = req.session.company.id;

  try {
    const tag2Costs = await db.projects.findAll({
      where: {
        company_id_fk: companyId,
        tag_2: {
          [Op.and]: {
            [Op.ne]: 0,
            [Op.ne]: null,
          },
        },
      },
      attributes: [
        "tag_2",
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.cast(
              db.Sequelize.fn(
                "NULLIF",
                db.Sequelize.fn(
                  "REPLACE",
                  db.Sequelize.col("project_cost"),
                  ",",
                  "",
                ),
                "",
              ),
              "NUMERIC",
            ),
          ),
          "total_cost",
        ],
      ],
      group: ["tag_2"],
      order: [
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.cast(
              db.Sequelize.fn(
                "NULLIF",
                db.Sequelize.fn(
                  "REPLACE",
                  db.Sequelize.col("project_cost"),
                  ",",
                  "",
                ),
                "",
              ),
              "NUMERIC",
            ),
          ),
          "DESC",
        ],
      ],
      raw: true,
    });

    const tagIds = tag2Costs.map((r) => r.tag_2);
    const tagRows = await db.tags.findAll({
      where: { id: { [Op.in]: tagIds } },
      attributes: ["id", "tag_name"],
      raw: true,
    });
    const nameMap = Object.fromEntries(tagRows.map((t) => [t.id, t.tag_name]));

    const result = tag2Costs.map((r) => ({
      tag_2: r.tag_2,
      tag_name: nameMap[r.tag_2] || null,
      total_cost: parseFloat(r.total_cost),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error in costProjectsByTag2:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.countEffortByTag2 = async (req, res) => {
  const companyId = req.session.company.id;

  try {
    const tag2Efforts = await db.projects.findAll({
      where: {
        company_id_fk: companyId,
        tag_2: {
          [Op.and]: {
            [Op.ne]: 0,
            [Op.ne]: null,
          },
        },
      },
      attributes: [
        "tag_2",
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.cast(
              db.Sequelize.fn(
                "NULLIF",
                db.Sequelize.fn("REPLACE", db.Sequelize.col("effort"), ",", ""),
                "",
              ),
              "NUMERIC",
            ),
          ),
          "total_effort",
        ],
      ],
      group: ["tag_2"],
      order: [
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.cast(
              db.Sequelize.fn(
                "NULLIF",
                db.Sequelize.fn("REPLACE", db.Sequelize.col("effort"), ",", ""),
                "",
              ),
              "NUMERIC",
            ),
          ),
          "DESC",
        ],
      ],
      raw: true,
    });

    const tagIds = tag2Efforts.map((r) => r.tag_2);
    const tagRows = await db.tags.findAll({
      where: { id: { [Op.in]: tagIds } },
      attributes: ["id", "tag_name"],
      raw: true,
    });
    const nameMap = Object.fromEntries(tagRows.map((t) => [t.id, t.tag_name]));

    const result = tag2Efforts.map((r) => ({
      tag_2: r.tag_2,
      tag_name: nameMap[r.tag_2] || null,
      total_effort: parseFloat(r.total_effort),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error in countEffortByTag2:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.countProjectsByTag3 = async (req, res) => {
  const companyId = req.session.company.id;

  try {
    // Count projects grouped by tag_1 and ensure tag_1 is not 0
    const tag3Counts = await db.projects.findAll({
      where: {
        company_id_fk: companyId,
        tag_3: {
          [Op.and]: {
            [Op.ne]: 0, // Ensure tag_1 is not 0
            [Op.ne]: null, // Ensure tag_1 is not null
          },
        },
      },
      attributes: [
        "tag_3",
        [
          db.Sequelize.fn("COUNT", db.Sequelize.col("projects.id")),
          "project_count",
        ],
      ],
      group: ["tag_3"],
      order: [
        [db.Sequelize.fn("COUNT", db.Sequelize.col("projects.id")), "DESC"],
      ],
    });

    // Fetch tag names for each tag_3
    const tag3Names = await db.tags.findAll({
      where: {
        id: {
          [Op.in]: tag3Counts.map((tag) => tag.tag_3),
        },
      },
      attributes: ["id", "tag_name"],
    });

    // Map tag names to tag3Counts
    const tag3CountsWithNames = tag3Counts.map((tag) => {
      const tagName = tag3Names.find((t) => t.id === tag.tag_3);
      return {
        tag_3: tag.tag_3,
        tag_name: tagName ? tagName.tag_name : null,
        project_count: tag.get("project_count"),
      };
    });

    // Send the response
    res.json(tag3CountsWithNames);
  } catch (error) {
    console.log("Query error:", error);
    return res.status(500).send({ message: "Server error" });
  }
};
exports.countCostsByTag3 = async (req, res) => {
  const companyId = req.session.company.id;

  try {
    const tag3Costs = await db.projects.findAll({
      where: {
        company_id_fk: companyId,
        tag_3: {
          [Op.and]: {
            [Op.ne]: 0,
            [Op.ne]: null,
          },
        },
      },
      attributes: [
        "tag_3",
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.cast(
              db.Sequelize.fn(
                "NULLIF",
                db.Sequelize.fn(
                  "REPLACE",
                  db.Sequelize.col("project_cost"),
                  ",",
                  "",
                ),
                "",
              ),
              "NUMERIC",
            ),
          ),
          "total_cost",
        ],
      ],
      group: ["tag_3"],
      order: [
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.cast(
              db.Sequelize.fn(
                "NULLIF",
                db.Sequelize.fn(
                  "REPLACE",
                  db.Sequelize.col("project_cost"),
                  ",",
                  "",
                ),
                "",
              ),
              "NUMERIC",
            ),
          ),
          "DESC",
        ],
      ],
      raw: true,
    });

    const tagIds = tag3Costs.map((r) => r.tag_3);
    const tagRows = await db.tags.findAll({
      where: { id: { [Op.in]: tagIds } },
      attributes: ["id", "tag_name"],
      raw: true,
    });
    const nameMap = Object.fromEntries(tagRows.map((t) => [t.id, t.tag_name]));

    const result = tag3Costs.map((r) => ({
      tag_3: r.tag_3,
      tag_name: nameMap[r.tag_3] || null,
      total_cost: parseFloat(r.total_cost),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error in costProjectsByTag3:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.countEffortByTag3 = async (req, res) => {
  const companyId = req.session.company.id;

  try {
    const tag3Efforts = await db.projects.findAll({
      where: {
        company_id_fk: companyId,
        tag_3: {
          [Op.and]: {
            [Op.ne]: 0,
            [Op.ne]: null,
          },
        },
      },
      attributes: [
        "tag_3",
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.cast(
              db.Sequelize.fn(
                "NULLIF",
                db.Sequelize.fn("REPLACE", db.Sequelize.col("effort"), ",", ""),
                "",
              ),
              "NUMERIC",
            ),
          ),
          "total_effort",
        ],
      ],
      group: ["tag_3"],
      order: [
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.cast(
              db.Sequelize.fn(
                "NULLIF",
                db.Sequelize.fn("REPLACE", db.Sequelize.col("effort"), ",", ""),
                "",
              ),
              "NUMERIC",
            ),
          ),
          "DESC",
        ],
      ],
      raw: true,
    });

    const tagIds = tag3Efforts.map((r) => r.tag_3);
    const tagRows = await db.tags.findAll({
      where: { id: { [Op.in]: tagIds } },
      attributes: ["id", "tag_name"],
      raw: true,
    });
    const nameMap = Object.fromEntries(tagRows.map((t) => [t.id, t.tag_name]));

    const result = tag3Efforts.map((r) => ({
      tag_3: r.tag_3,
      tag_name: nameMap[r.tag_3] || null,
      total_effort: parseFloat(r.total_effort),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error in countEffortByTag3:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.flight = async (req, res) => {
  const companyId = req.session.company.id;

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
      latest_status.issue, 
      latest_status.actions, 
      proj.project_name,
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
      (SELECT 
         s.project_id_fk, 
         s.issue, 
         s.actions 
       FROM 
         statuses s 
       WHERE 
         s.status_date = (SELECT MAX(status_date) FROM statuses WHERE project_id_fk = s.project_id_fk)
      ) AS latest_status ON latest_status.project_id_fk = proj.id
    WHERE 
      proj.company_id_fk = ?
    ORDER BY 
      proj.phase_id_fk;
  `;
  const portfolioName = await returnPortfolioName(companyId);

  const data = await db.sequelize.query(query, {
    replacements: [company_id_fk],
    type: db.sequelize.QueryTypes.SELECT,
  });
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
    res.render("Pages/pages_flight_plan", {
      start_date: startDateTest,
      projects: data,
      portfolioName,
    });
  } catch (error) {
    console.log("Query error:", error);
    return res.status(500).send({ message: "Server error" });
  }
};
// Define the findFunnel function
exports.findFunnel = async (req, res) => {
  try {
    console.log(
      "============================================== findFunnel called ==============================================",
    );
    const company_id_fk = req.session.company.id;
    const person_id_fk = req.session.person.id;
    const personsData = await Person.findAll({
      where: {
        company_id_fk: company_id_fk,
      },
    });

    let tagsData = await Tag.findAll({
      where: {
        [Op.or]: [{ company_id_fk: company_id_fk }, { company_id_fk: 0 }],
      },
      order: [["id", "ASC"]],
    });
    // Custom SQL query to retrieve project data
    console.log("Company ID:", company_id_fk, "Person ID:", person_id_fk);

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
      phases.phase_name,
      COUNT(proj.id) AS phase_count
    FROM
      projects proj
    LEFT JOIN
      persons prime_person ON prime_person.id = proj.prime_id_fk
    LEFT JOIN
      persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk
    LEFT JOIN
      phases ON phases.id = proj.phase_id_fk
    WHERE
      proj.company_id_fk = ? AND proj.phase_id_fk = 1
    GROUP BY
      proj.company_id_fk,
      proj.id,
      proj.project_name,
      proj.start_date,
      proj.end_date,
      proj.health,
      proj.effort,
      prime_person.first_name,
      prime_person.last_name,
      sponsor_person.first_name,
      sponsor_person.last_name,
      proj.project_cost,
      phases.phase_name
  `;

    const data = await db.sequelize.query(query, {
      replacements: [company_id_fk, person_id_fk, person_id_fk],
      type: db.sequelize.QueryTypes.SELECT,
    });
    console.log(
      "++++++++++++++++++++++++++++++++++ DATA:",
      data[0].project_name + "+++++++++++++++++++++++++++++++++++++",
    );
    // Calculate pitch count, total cost, and total effort
    const pitchCount = data.length;
    let pitchTotalCost = 0;
    let pitchTotalPH = 0;

    data.forEach((project) => {
      // Correctly accumulate the total cost
      pitchTotalCost +=
        parseFloat((project.project_cost || "0").replace(/,/g, "")) || 0;
      pitchTotalPH += parseFloat(project.effort) || 0;
    });

    // Retrieve phases and priorities
    const phases = await Phase.findAll({
      order: [["id", "ASC"]],
    });
    const priorities = await Priority.findAll();

    // Retrieve sponsors and primes
    const persons = await Person.findAll({
      where: { company_id_fk: company_id_fk },
    });
    const sponsors = persons.filter((person) => person.role === "sponsor");
    const primes = persons.filter((person) => person.role === "prime");
    pitchTotalPH = formatCost(pitchTotalPH);
    console.log("Pitch Total PH:", pitchTotalPH);
    const portfolioName = await returnPortfolioName(company_id_fk);
    // Render the funnel page with the retrieved data
    res.render("Pages/pages-funnel", {
      phases: phases,
      priorities: priorities,
      projects: data,
      sponsors: personsData,
      primes: personsData,
      pitchCount: pitchCount,
      pitchTotalCost: formatCost(pitchTotalCost),
      pitchTotalPH: formatCost(pitchTotalPH),
      tags: tagsData,
      portfolioName,
    });
  } catch (error) {
    console.error("Error finding funnel:", error);
    res.status(500).json({ message: "Error finding funnel" });
  }
};
//now is now find Archived
exports.findFreezer = async (req, res) => {
  const company_id_fk = req.session.company.id;
  console.log("findFreezer called with company_id_fk:", company_id_fk);
  const query = `
    SELECT  
    proj.company_id_fk, 
    proj.id, 
    proj.project_name, 
    proj.start_date, 
    proj.end_date,
    proj.health, 
    proj.effort, 
    prime_person.first_name AS prime_first_name,
    prime_person.last_name AS prime_last_name, 
    sponsor_person.first_name AS sponsor_first_name,
    sponsor_person.last_name AS sponsor_last_name, 
    proj.project_cost, 
    phases.phase_name,
    companies.portfolio_budget AS company_budget,
    companies.company_headline AS portfolio_name,
    companies.effort AS company_effort,
    latest_status.health AS latest_status_health,
    latest_status.status_date AS latest_status_date,

    
    (
      SELECT COALESCE(SUM(p1.effort::integer), 0)
      FROM projects p1
      WHERE p1.company_id_fk = proj.company_id_fk AND p1.phase_id_fk = 1
    ) AS total_effort_phase_1

FROM 
    projects proj
LEFT JOIN 
    persons prime_person ON prime_person.id = proj.prime_id_fk
LEFT JOIN 
    persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk
LEFT JOIN 
    phases ON phases.id = proj.phase_id_fk
LEFT JOIN 
    companies ON companies.id = proj.company_id_fk
LEFT JOIN (
    SELECT s1.*
    FROM statuses s1
    INNER JOIN (
        SELECT project_id_fk, MAX(status_date) AS max_date
        FROM statuses
        GROUP BY project_id_fk
    ) s2 ON s1.project_id_fk = s2.project_id_fk AND s1.status_date = s2.max_date
) latest_status ON latest_status.project_id_fk = proj.id

WHERE 
    proj.company_id_fk = ? AND proj.phase_id_fk = 6

ORDER BY 
    proj.phase_id_fk;
`;

  try {
    const data = await db.sequelize.query(query, {
      replacements: [company_id_fk],
      type: db.sequelize.QueryTypes.SELECT,
    });
    console.log("Freezer Data retrieved successfully:", data);
    if (!data || data.length === 0) {
      console.log("No data found for company_id_fk:", company_id_fk);
      return res.redirect("/projects");
    }
    // console.log("Data retrieved successfully:", data.length, "records found.");
    // Initialize phase data with default values
    const phaseData = {
      pitch: { count: 0, cost: 0, ph: 0 },
      planning: { count: 0, cost: 0, ph: 0 },
      discovery: { count: 0, cost: 0, ph: 0 },
      delivery: { count: 0, cost: 0, ph: 0 },
      done: { count: 0, cost: 0, ph: 0 },
      archived: { count: 0, cost: 0, ph: 0 },
    };
    console.log("Phase data initialized:", phaseData);
    // Retrieve portfolio_budget and portfolio_effort from the first record
    const portfolio_budget = data[0].company_budget
      ? removeCommasAndConvert(data[0].company_budget)
      : 0;
    console.log("Portfolio budget retrieved:", portfolio_budget);
    const portfolio_effort = data[0].company_effort
      ? removeCommasAndConvert(data[0].company_effort)
      : 0;
    console.log("Portfolio effort retrieved:", portfolio_effort);
    // Process data and calculate totals
    data.forEach((project) => {
      // Parse project cost and effort
      const projectCost = project.project_cost
        ? removeCommasAndConvert(project.project_cost) || 0
        : 0;
      console.log("Project Cost:", projectCost);
      const projectEffortPH = project.effort
        ? removeCommasAndConvert(project.effort) || 0
        : 0;
      console.log("Project Effort (PH):", projectEffortPH);

      // Categorize by phase name and accumulate values
      const phase = project.phase_name?.toLowerCase() || "unknown";

      if (phaseData[phase]) {
        phaseData[phase].count++;
        phaseData[phase].cost += projectCost;
        phaseData[phase].ph += projectEffortPH;

        // Debug logs
        // console.log(`Project Effort (PH): ${projectEffortPH}`);
        // console.log(
        //   `Phase: ${phase}, Count: ${phaseData[phase].count}, Cost: ${phaseData[phase].cost}, PH: ${phaseData[phase].ph}`,
        // );
      } else {
        console.warn("Unknown phase:", project.phase_name);
      }
    });
    // Calculate used values
    const usedCost =
      phaseData.planning.cost +
      phaseData.discovery.cost +
      phaseData.delivery.cost +
      phaseData.done.cost;

    const usedEffort =
      phaseData.planning.ph +
      phaseData.discovery.ph +
      phaseData.delivery.ph +
      phaseData.done.ph;

    // Calculate available values
    const totalAvailPH = portfolio_effort - usedEffort;
    const availableCost = portfolio_budget - usedCost;

    // Determine colors based on availability
    const availablePHColor =
      isNaN(totalAvailPH) || totalAvailPH < 0 ? "red" : "green";
    const availableCostColor =
      isNaN(availableCost) || availableCost < 0 ? "red" : "green";
    // Format data for response
    const formattedData = {
      totalPH: formatToKMB(portfolio_effort),
      totalUsedPH: formatToKMB(usedEffort),
      totalAvailPH: formatToKMB(totalAvailPH),
      pitch: {
        count: phaseData.pitch.count,
        cost: formatToKMB(phaseData.pitch.cost),
        ph: formatToKMB(phaseData.pitch.ph),
      },
      planning: {
        count: phaseData.planning.count,
        cost: formatToKMB(phaseData.planning.cost),
        ph: formatToKMB(phaseData.planning.ph),
      },
      discovery: {
        count: phaseData.discovery.count,
        cost: formatToKMB(phaseData.discovery.cost),
        ph: formatToKMB(phaseData.discovery.ph),
      },
      delivery: {
        count: phaseData.delivery.count,
        cost: formatToKMB(phaseData.delivery.cost),
        ph: formatToKMB(phaseData.delivery.ph),
      },
      operations: {
        count: phaseData.done.count,
        cost: formatToKMB(phaseData.done.cost),
        ph: formatToKMB(phaseData.done.ph),
      },
      archived: {
        count: phaseData.archived.count,
        cost: formatToKMB(phaseData.archived.cost),
        ph: formatToKMB(phaseData.archived.ph),
      },

      totalCost: formatToKMB(portfolio_budget),
      usedCost: formatToKMB(usedCost),
      availableCost: formatToKMB(availableCost),
      usedEffort: formatToKMB(usedEffort),
    };

    //get all phases for add project modal
    const phases = await db.phases.findAll({});
    //get all priorities for add project modal
    const priorities = await db.priorities.findAll({});
    //get all persons for primes and sponsors add project modal
    const persons = await db.persons.findAll({ where: { company_id_fk } });
    // Fetch tags
    let tagsData = await Tag.findAll({
      where: {
        [Op.or]: [{ company_id_fk: company_id_fk }, { company_id_fk: 0 }],
      },
      order: [["id", "ASC"]],
    });

    // Add "None" option at the top of the tags list
    tagsData = [{ id: 0, tag_name: "None" }, ...tagsData];
    //get status information and add to render data
    // const statusData = await db.statuses.findAll({
    //   where: { project_id_fk: projects.id },
    // });
    // console.log("Status Data:", statusData);

    // Render dashboard with all calculated values
    const portfolioName = req.session.company.company_headline;
    const projects = await db.projects.findAll({
      where: {
        company_id_fk: company_id_fk,
        phase_id_fk: 6,
      },
      attributes: ["id", "project_name", "project_cost", "effort", "reference"],
    });
    const archivedCount = projects.length;

    let archivedTotalPH = 0;
    let archivedTotalCost = 0;

    projects.forEach((project) => {
      archivedTotalCost += Number(project.project_cost) || 0;
      archivedTotalPH += parseFloat(project.effort) || 0;
    });
    archivedTotalCost = formatCost(archivedTotalCost);
    archivedTotalPH = formatCost(archivedTotalPH);

    res.render("Pages/pages-freezer", {
      projects: data,
      archivedTotalCost,
      archivedCount,
      archivedTotalPH,
    });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.update = async (req, res) => {
  const funnelPage = req.body.funnelPage;

  try {
    const { id } = req.params;
    const {
      project_name,
      project_headline,
      project_why,
      project_what,
      start_date,
      end_date,
      prime_id_fk,
      sponsor_id_fk,
      project_cost,
      effort,
      benefit,
      phase_id_fk,
      next_milestone_date,
      tag_1,
      tag_2,
      tag_3,
      reference,
      change_reason, // This is the ID
      change_explanation, // User's explanation from the form
    } = req.body;

    // Convert and sanitize as before...
    const startDateTest = insertValidDate(start_date);
    const endDateTest = insertValidDate(end_date);
    const nextMilestoneDateTest = insertValidDate(next_milestone_date);
    const sanitizedProjectCost = project_cost
      ? removeCommasAndConvertToNumber(project_cost)
      : 0;
    const sanitizedEffort = effort ? removeCommasAndConvertToNumber(effort) : 0;
    const sanitizedBenefit = benefit
      ? removeCommasAndConvertToNumber(benefit)
      : 0;
    // const sanitizedImpact = impact ? removeCommasAndConvertToNumber(impact) : 0;
    // const sanitizedComplexity = complexity
    //   ? removeCommasAndConvertToNumber(complexity)
    //   : 0;

    const sanitizedTag1 = tag_1 ? parseInt(tag_1.replace(/,/g, ""), 10) : null;
    const sanitizedTag2 = tag_2 ? parseInt(tag_2.replace(/,/g, ""), 10) : null;
    const sanitizedTag3 = tag_3 ? parseInt(tag_3.replace(/,/g, ""), 10) : null;

    // Update the project
    const [num] = await Project.update(
      {
        project_name,
        project_headline,
        project_why,
        project_what,
        start_date: startDateTest,
        end_date: endDateTest,
        prime_id_fk,
        sponsor_id_fk,
        project_cost: sanitizedProjectCost,
        effort: sanitizedEffort,
        benefit: sanitizedBenefit,
        phase_id_fk,
        next_milestone_date: nextMilestoneDateTest,
        tag_1: sanitizedTag1,
        tag_2: sanitizedTag2,
        tag_3: sanitizedTag3,
        reference,
      },
      {
        where: { id },
      },
    );

    if (num === 1) {
      // Create a new ChangedProject entry after successful update

      const newChangedProject = {
        project_id_fk: id,
        company_id_fk: req.session.company?.id,
        change_date: new Date(),
        project_name,
        project_headline,
        project_why,
        project_what,
        start_date: startDateTest,
        end_date: endDateTest,
        prime_id_fk,
        sponsor_id_fk,
        project_cost: sanitizedProjectCost,
        effort,
        benefit,
        phase_id_fk,
        change_reason_id_fk: change_reason,
        change_explanation: change_explanation, // <-- Use user input
        tag_1: sanitizedTag1,
        tag_2: sanitizedTag2,
        tag_3: sanitizedTag3,
      };

      await ChangeProject.create(newChangedProject);

      if (funnelPage !== undefined && funnelPage !== null) {
        res.redirect("/projects/funnel");
      } else {
        res.redirect("/projects/");
      }
    } else {
      res.status(404).send({
        message: `Cannot update Project with id=${id}. Maybe Project was not found or req.body is empty!`,
      });
    }
  } catch (error) {
    console.error("Error updating project:", error.message, error.stack);
    res.status(500).send("Internal Server Error");
  }
};

exports.health = async (req, res) => {
  //get all company projects
  const company_id_fk = req.session.company.id;
  const portfolioName = req.session.company.company_headline;

  const costQuery = `SELECT 
    proj.company_id_fk,
    proj.id AS project_id,
    proj.project_name,
    proj.start_date,
    proj.end_date,
    proj.health,
    proj.effort,
    proj.reference,
    prime_person.first_name AS prime_first_name,
    prime_person.last_name AS prime_last_name,
    sponsor_person.first_name AS sponsor_first_name,
    sponsor_person.last_name AS sponsor_last_name,
    proj.project_cost,
    phases.phase_name,
    phases.id AS phase_id,
    companies.portfolio_budget AS company_budget,
    companies.effort AS company_effort,
    (SELECT json_build_object(
             'progress', status.progress,
             'issue', status.issue,
             'actions', status.actions,
             'health', status.health)
     FROM statuses status
     WHERE status.project_id_fk = proj.id
     ORDER BY status.status_date DESC
     LIMIT 1) AS last_status
FROM
    projects proj
LEFT JOIN
    persons prime_person ON prime_person.id = proj.prime_id_fk
LEFT JOIN
    persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk
LEFT JOIN
    phases ON phases.id = proj.phase_id_fk
LEFT JOIN
    companies ON companies.id = proj.company_id_fk
WHERE
    proj.company_id_fk = ?
ORDER BY s.status_date DESC;


`;
  costData = await db.sequelize.query(costQuery, {
    replacements: [company_id_fk],
    type: db.sequelize.QueryTypes.SELECT,
  });

  if (costData) {
    // Loop through data and get the most recent progress for each project
    costData.forEach((project) => {
      if (project.statuses && project.statuses.length > 0) {
        project.mostRecentProgress = project.statuses.reduce(
          (latest, status) => {
            return new Date(status.date) > new Date(latest.date)
              ? status
              : latest;
          },
        );
      } else {
        project.mostRecentProgress = null;
      }
    });
    res.render("Pages/pages-health", {
      portfolioName,
      projects: costData,
      currentDate: moment().format("MMMM Do YYYY"),
    });
  } else {
    console.log("Error fetching project data, nothing there");
  }
};
exports.ganttChart = async (req, res) => {
  //get all company projects

  const company_id_fk = req.session.company.id;

  const companyProjects = await Project.findAll({
    where: { company_id_fk: company_id_fk },
  });

  const colors = [];
  for (const project of companyProjects) {
    // Fetch the most recent status for this project
    const status = await db.statuses.findOne({
      where: { project_id_fk: project.id },
      order: [["createdAt", "DESC"]],
      attributes: ["progress", "health"],
    });

    colors.push(status ? status.health : "No status available");
  }

  res.json({ companyProjects: companyProjects, colors: colors });
};
exports.flightview = async (req, res) => {
  //get all company projects

  const company_id_fk = req.session.company.id;

  const companyProjects = await Project.findAll({
    where: { company_id_fk: company_id_fk },
  });
  const company = await db.companies.findOne({
    where: { id: company_id_fk },
    attributes: ["company_headline"],
  });

  // Check if the company exists
  if (!company) {
    return res.status(404).json({ message: "Company not found" });
  }

  const portfolioName = company.company_headline;
  res.render("Pages/pages_flight_plan", {
    projects: companyProjects,
    currentDate: moment().format("MMMM Do YYYY"),
    portfolioName,
  });
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
exports.archvive = (req, res) => {
  const id = req.params.id;

  Project.update({
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

// Helper function to insert valid date
function insertValidDate(date) {
  return date ? moment(date, "YYYY-MM-DD").toDate() : null;
}

// function formatNumberWithCommas(input) {
//   if (input && typeof input.value === "string") {
//     // Remove non-numeric characters
//     let value = input.value.replace(/\D/g, "");

//     // Format the number with commas
//     value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

//     // Set the formatted value back to the input
//     input.value = value;
//   } else {
//     console.error("Invalid input or input value:", input);
//   }
// }

function removeCommasAndConvertToNumber(value) {
  if (typeof value === "string") {
    return parseFloat(value.replace(/,/g, ""));
  }
  return value;
}

const formatCost = (cost) => {
  if (cost === null || cost === undefined) return "0";
  if (cost >= 1_000_000_000) return `${(cost / 1_000_000_000).toFixed(1)}B`;
  if (cost >= 1_000_000) return `${(cost / 1_000_000).toFixed(1)}M`;
  if (cost >= 1_000) return `${(cost / 1_000).toFixed(1)}K`;
  return cost.toString();
};
async function returnPortfolioName(company_id_fk) {
  // Fetch the company headline from the database
  const company = await db.companies.findOne({
    where: { id: company_id_fk },
    attributes: ["company_headline"],
  });

  // Check if the company exists and return the headline
  if (!company || !company.company_headline) {
    return "Portfolio name not found";
  }

  return company.company_headline;
}

exports.exportHealthDataToCSV = async (req, res) => {
  console.log("Exporting health data to CSV...");
  try {
    const company_id_fk = req.session.company.id;

    // Fetch projects
    const projects = await db.projects.findAll({
      where: { company_id_fk },
      attributes: [
        "id",
        "project_name",
        "project_headline",
        "project_cost",
        "effort",
        "benefit",
        "start_date",
        "end_date",
        "next_milestone_date",
        "benefit",
      ],
      raw: true,
    });

    const statuses = await db.sequelize.query(
      `
      SELECT s.project_id_fk, s.status_date, s.progress, s.health, s.accomplishments, s.issue, s.actions
      FROM statuses s
      INNER JOIN (
        SELECT project_id_fk, MAX(status_date) AS max_status_date
        FROM statuses
        GROUP BY project_id_fk
      ) latest_status
      ON s.project_id_fk = latest_status.project_id_fk AND s.status_date = latest_status.max_status_date
      ORDER BY s.status_date DESC
      `,
      { type: db.Sequelize.QueryTypes.SELECT },
    );
    console.log("Statuses fetched:", statuses.length);
    // Map statuses to their corresponding projects
    const statusMap = {};
    statuses.forEach((status) => {
      statusMap[status.project_id_fk] = status;
    });

    // Combine project and status data
    const combinedData = projects.map((project) => {
      const status = statusMap[project.id] || {
        status_date: "",
        progress: "",
        health: "",
        accomplishments: "",
        issue: "",
        actions: "",
      };
      // Format dates in yyyy-dd-mm format
      const formattedStartDate = project.start_date
        ? moment(project.start_date).format("YYYY-DD-MM")
        : "";
      const formattedEndDate = project.end_date
        ? moment(project.end_date).format("YYYY-DD-MM")
        : "";
      const formattedNMSDate = project.next_milestone_date
        ? moment(project.next_milestone_date).format("YYYY-DD-MM")
        : "";
      const formattedStatusDate = status.status_date
        ? moment(project.next_milestone_date).format("YYYY-DD-MM")
        : "";

      return {
        Name: project.project_name,
        Headline: project.project_headline,
        "Start Date": formattedStartDate,
        "End Date": formattedEndDate,
        "NMS Date": formattedNMSDate,
        "Status Date": formattedStatusDate,
        Benefit: project.benefit,
        Progress: status.progress + " %",
        Health: status.health,
        Accomplishments: status.accomplishments,
        Issues: status.issue,
        Actions: status.actions,
        Cost: "$" + project.project_cost || 0,
        Effort: project.effort || 0,
      };
    });

    // Define the fields for the CSV
    const fields = [
      "Name",
      "Headline",

      "Benefit",
      "Start Date",
      "End Date",
      "NMS Date",
      "Status Date",
      "Progress",
      "Health",
      "Accomplishments",
      "Issues",
      "Actions",
      "Cost",
      "Effort",
    ];

    // // Convert JSON to CSV
    // const json2csvParser = new Parser({ fields });
    // const csv = json2csvParser.parse(combinedData);

    // // Set headers and send the CSV file
    // res.header("Content-Type", "text/csv");
    // res.attachment("projects_with_status.csv");
    // res.send(csv);
  } catch (error) {
    console.error("Error exporting projects with status to CSV:", error);
    res
      .status(500)
      .send({ message: "Error exporting projects with status to CSV." });
  }
  res.send("Pdf created successfully");
};
exports.exportProjectsWithStatusToCSV = async (req, res) => {
  console.log("Exporting projects with status to CSV...");
  try {
    const company_id_fk = req.session.company.id;

    // Fetch projects with phase_name, prime, sponsor, and benefit details
    const projects = await db.sequelize.query(
      `
      SELECT 
        proj.id,
        proj.project_name,
        proj.project_headline,
        proj.project_cost,
        proj.effort,
        proj.benefit, -- Include benefit field
        proj.start_date,
        proj.end_date,
        proj.next_milestone_date,
        phases.phase_name,
        prime_person.first_name AS prime_first_name,
        prime_person.last_name AS prime_last_name,
        sponsor_person.first_name AS sponsor_first_name,
        sponsor_person.last_name AS sponsor_last_name
      FROM projects proj
      LEFT JOIN phases ON proj.phase_id_fk = phases.id
      LEFT JOIN persons prime_person ON proj.prime_id_fk = prime_person.id
      LEFT JOIN persons sponsor_person ON proj.sponsor_id_fk = sponsor_person.id
      WHERE proj.company_id_fk = ?
      `,
      { replacements: [company_id_fk], type: db.Sequelize.QueryTypes.SELECT },
    );

    // Fetch statuses for the projects
    const statuses = await db.sequelize.query(
      `
      SELECT 
        s.project_id_fk, 
        s.status_date, 
        s.progress, 
        s.health, 
        s.accomplishments, 
        s.issue, 
        s.actions
      FROM statuses s
      INNER JOIN (
        SELECT project_id_fk, MAX(status_date) AS max_status_date
        FROM statuses
        GROUP BY project_id_fk
      ) latest_status
      ON s.project_id_fk = latest_status.project_id_fk AND s.status_date = latest_status.max_status_date
      `,
      { type: db.Sequelize.QueryTypes.SELECT },
    );

    // Map statuses to their corresponding projects
    const statusMap = {};
    statuses.forEach((status) => {
      if (status.health === "Black") {
        status.health = "";
      } else if (status.health === "Green") {
        status.health = "Healthy";
      } else if (status.health === "Yellow") {
        status.health = "Caution";
      } else if (status.health === "Red") {
        status.health = "Danger";
      }
      statusMap[status.project_id_fk] = status;
    });

    // Combine project and status data
    const combinedData = projects.map((project) => {
      const status = statusMap[project.id] || {
        status_date: "",
        progress: "",
        health: "",
        accomplishments: "",
        issue: "",
        actions: "",
      };

      // Format dates in yyyy-dd-mm format
      const formattedStartDate = project.start_date
        ? moment(project.start_date).format("YYYY-DD-MM")
        : "";
      const formattedEndDate = project.end_date
        ? moment(project.end_date).format("YYYY-DD-MM")
        : "";
      const formattedNMSDate = project.next_milestone_date
        ? moment(project.next_milestone_date).format("YYYY-DD-MM")
        : "";
      const formattedStatusDate = status.status_date
        ? moment(status.status_date, "YYYY-MM-DD", true).isValid()
          ? moment(status.status_date).format("YYYY-DD-MM")
          : ""
        : "";

      return {
        Name: project.project_name,
        Headline: project.project_headline,
        Phase: project.phase_name || "", // Include phase_name
        Sponsor: project.sponsor_first_name
          ? `${project.sponsor_last_name}, ${project.sponsor_first_name}`
          : "", // Include sponsor details
        Prime: project.prime_first_name
          ? `${project.prime_last_name}, ${project.prime_first_name}`
          : "", // Include prime details
        Effort: project.effort || 0 + " %",
        Cost: "$" + project.project_cost || 0,

        Benefit: project.benefit || "", // Map benefit field
        "Start Date": formattedStartDate,
        "End Date": formattedEndDate,
        "NMS Date": formattedNMSDate,
        "Status Date": formattedStatusDate,
        Progress: status.progress,
        Health: status.health,
        Accomplishments: status.accomplishments,
        Issues: status.issue,
        Actions: status.actions,
      };
    });

    // Define the fields for the CSV
    const fields = [
      "Name",
      "Headline",
      "Phase",
      "Prime",
      "Sponsor",
      "Cost",
      "Effort",
      "Benefit", // Add Benefit column
      "Start Date",
      "End Date",
      "NMS Date",
      "Status Date",
      "Progress",
      "Health",
      "Accomplishments",
      "Issues",
      "Actions",
    ];

    // Convert JSON to CSV
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(combinedData);
    const exportDate = moment().format("YYYY-MM-DD");
    const fileName = `${exportDate} PriorityPilot - Project List.csv`;

    // Set headers and send the CSV file
    res.header("Content-Type", "text/csv");
    res.attachment(exportDate + " PriorityPilot - Projects.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error exporting projects with status to CSV:", error);
    res
      .status(500)
      .send({ message: "Error exporting projects with status to CSV." });
  }
};
exports.exportHealthDataToPDF = async (req, res) => {
  console.log("Exporting health data to PDF...");
  try {
    const company_id_fk = req.session.company.id;
    const portfolioName = req.session.company.company_headline;

    // Fetch the same data as your health page
    const costQuery = `SELECT 
      proj.company_id_fk,
      proj.id AS project_id,
      proj.project_name,
      proj.start_date,
      proj.end_date,
      proj.health,
      proj.effort,
      proj.reference,
      prime_person.first_name AS prime_first_name,
      prime_person.last_name AS prime_last_name,
      sponsor_person.first_name AS sponsor_first_name,
      sponsor_person.last_name AS sponsor_last_name,
      proj.project_cost,
      phases.phase_name,
      phases.id AS phase_id,
      companies.portfolio_budget AS company_budget,
      companies.effort AS company_effort,
      (SELECT json_build_object(
               'progress', status.progress,
               'issue', status.issue,
               'actions', status.actions,
               'health', status.health)
       FROM statuses status
       WHERE status.project_id_fk = proj.id
       ORDER BY status.status_date DESC
       LIMIT 1) AS last_status
    FROM
      projects proj
    LEFT JOIN
      persons prime_person ON prime_person.id = proj.prime_id_fk
    LEFT JOIN
      persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk
    LEFT JOIN
      phases ON phases.id = proj.phase_id_fk
    LEFT JOIN
      companies ON companies.id = proj.company_id_fk
    WHERE
      proj.company_id_fk = ?
    ORDER BY
      proj.phase_id_fk, proj.id;`;

    const costData = await db.sequelize.query(costQuery, {
      replacements: [company_id_fk],
      type: db.sequelize.QueryTypes.SELECT,
    });
    const doc = new jsPDF();
    const date = moment().format("MMMM Do YYYY");
    doc.text("Hello world!", 10, 10);
    doc.save(`${date} - PriorityPilot Health Report.pdf`);
    res.send(
      `PDF created successfully" ${date} - PriorityPilot Health Report.pdf`, //add link here for user to download
    );
    // // Render the EJS template to HTML string
    // res.render(
    //   "Pages/pages-health-pdf",
    //   {
    //     portfolioName,
    //     projects: costData,
    //     currentDate: require("moment")().format("MMMM Do YYYY"),
    //     layout: false, // Don't include the main layout if you want just the page
    //   },
    //   async (err, html) => {
    //     if (err) {
    //       console.error("EJS render error:", err);
    //       return res.status(500).send("Error rendering page for PDF.");
    //     }

    //     const doc = new jsPDF();

    //     doc.text("Hello world!", 10, 10);
    //     doc.save("a4.pdf");
    //   },
    // );
  } catch (error) {
    console.error("Error exporting page to PDF:", error);
    res.status(500).send("Internal Server Error");
  }
};
// try {
//   const company_id_fk = req.session.company.id;

//   // Fetch projects
//   const projects = await db.projects.findAll({
//     where: { company_id_fk },
//     attributes: [
//       "id",
//       "project_name",
//       "project_headline",
//       "project_cost",
//       "effort",
//       "benefit",
//       "start_date",
//       "end_date",
//       "next_milestone_date",
//       "benefit",
//     ],
//     raw: true,
//   });

//   const statuses = await db.sequelize.query(
//     `
//     SELECT s.project_id_fk, s.status_date, s.progress, s.health, s.accomplishments, s.issue, s.actions
//     FROM statuses s
//     INNER JOIN (
//       SELECT project_id_fk, MAX(status_date) AS max_status_date
//       FROM statuses
//       GROUP BY project_id_fk
//     ) latest_status
//     ON s.project_id_fk = latest_status.project_id_fk AND s.status_date = latest_status.max_status_date
//     `,
//     { type: db.Sequelize.QueryTypes.SELECT },
//   );

//   // Map statuses to their corresponding projects
//   const statusMap = {};
//   statuses.forEach((status) => {
//     statusMap[status.project_id_fk] = status;
//   });

//   // Combine project and status data
//   const combinedData = projects.map((project) => {
//     const status = statusMap[project.id] || {
//       status_date: "",
//       progress: "",
//       health: "",
//       accomplishments: "",
//       issue: "",
//       actions: "",
//     };
//     // Format dates in yyyy-dd-mm format
//     const formattedStartDate = project.start_date
//       ? moment(project.start_date).format("YYYY-DD-MM")
//       : "";
//     const formattedEndDate = project.end_date
//       ? moment(project.end_date).format("YYYY-DD-MM")
//       : "";
//     const formattedNMSDate = project.next_milestone_date
//       ? moment(project.next_milestone_date).format("YYYY-DD-MM")
//       : "";
//     const formattedStatusDate = status.status_date
//       ? moment(project.next_milestone_date).format("YYYY-DD-MM")
//       : "";

//     return {
//       Name: project.project_name,
//       Headline: project.project_headline,
//       "Start Date": formattedStartDate,
//       "End Date": formattedEndDate,
//       "NMS Date": formattedNMSDate,
//       "Status Date": formattedStatusDate,
//       Benefit: project.benefit,
//       Progress: status.progress + " %",
//       Health: status.health,
//       Accomplishments: status.accomplishments,
//       Issues: status.issue,
//       Actions: status.actions,
//       Cost: "$" + project.project_cost || 0,
//       Effort: project.effort || 0,
//     };
//   });

//   // Define the fields for the CSV
//   const fields = [
//     "Name",
//     "Headline",

//     "Benefit",
//     "Start Date",
//     "End Date",
//     "NMS Date",
//     "Status Date",
//     "Progress",
//     "Health",
//     "Accomplishments",
//     "Issues",
//     "Actions",
//     "Cost",
//     "Effort",
//   ];

//   // Convert JSON to CSV
//   const json2csvParser = new Parser({ fields });
//   const csv = json2csvParser.parse(combinedData);

//   // Set headers and send the CSV file
//   res.header("Content-Type", "text/csv");
//   res.attachment("projects_with_status.csv");
//   res.send(csv);
// } catch (error) {
//   console.error("Error exporting projects with status to CSV:", error);
//   res
//     .status(500)
//     .send({ message: "Error exporting projects with status to CSV." });
// }

// Function to remove commas and convert to number
function removeCommasAndConvert(numStr) {
  if (typeof numStr !== "string") {
    numStr = numStr.toString();
  }
  return parseFloat(numStr.replace(/,/g, ""));
}
function formatToKMB(num) {
  if (typeof num !== "number") {
    num = parseFloat(num) || 0;
  }
  const isNegative = num < 0;
  num = Math.abs(num);
  if (num >= 1e9) return (isNegative ? "-" : "") + (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (isNegative ? "-" : "") + (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (isNegative ? "-" : "") + (num / 1e3).toFixed(2) + "K";
  return (isNegative ? "-" : "") + num.toFixed(2);
}
