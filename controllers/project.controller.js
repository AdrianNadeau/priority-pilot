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
  const endDateTest = insertValidDate(req.body.end_date);
  const nextMilestoneDateTest = insertValidDate(req.body.next_milestone_date);

  let pitch_message = "";
  if (req.body.phase_id_fk == 1) {
    pitch_message = req.body.pitch_message;
  }
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
    pitch_message: pitch_message,
    tag_1: req.body.tag_1,
    tag_2: req.body.tag_2,
    tag_3: req.body.tag_3,
  };
  const tags = {
    tag_1: req.body.tag_1 || 0,
    tag_2: req.body.tag_2 || 0,
    tag_3: req.body.tag_3 || 0,
    // other project fields
  };
  // Save Project in the database
  Project.create(project).then(async (data) => {
    const phasesData = await Phase.findAll({
      order: [["id", "ASC"]],
    }).catch((error) => {
      console.log("Error fetching phasesData:", error);
    });
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
          tags: tagsData,
        });
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while retrieving data.",
        });
      });
  });
};

exports.findAllRadar = async (req, res) => {
  const type = req.params.type;

  // Get company id from session
  let company_id_fk;
  try {
    if (!req.session) {
      return res.redirect("/pages-500");
    } else {
      company_id_fk = req.session.company.id;
    }
  } catch (error) {
    console.log("error:", error);
    return res.status(500).json({ message: "Error retrieving session data." });
  }
  // Get all company projects with the latest status health
  try {
    const projects = await Project.findAll({
      where: { company_id_fk: company_id_fk },
    });

    // Get the most recent status for each project
    const statuses = await db.sequelize.query(
      `
      SELECT 
        s.project_id_fk, 
        s.health, 
        s.status_date,
        s.progress
      FROM 
        statuses s
      WHERE 
        s.status_date = (SELECT MAX(status_date) FROM statuses WHERE project_id_fk = s.project_id_fk)
    `,
      {
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

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
    res.status(200).json(projectsWithStatus);
  } catch (error) {
    console.log("Error retrieving projects:", error);
    res.status(500).json({ message: "Error retrieving projects." });
  }
};
// Retrieve all  from the database.
exports.findAll = async (req, res) => {
  console.log("find all");
  try {
    try {
      if (!req.session) {
        return res.redirect("/pages-500");
      } else {
        console.log("req.session.company.id", req.session.company.id);
        company_id_fk = req.session.company.id;
        company = req.session.company;
      }
    } catch (error) {
      console.log("error:", error);
      return res
        .status(500)
        .json({ message: "Error retrieving session data." });
    }
    console.log("getting tags for company");

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

    const query =
      "SELECT proj.company_id_fk,proj.id, proj.project_name, proj.start_date, proj.end_date, prime_person.first_name AS prime_first_name, prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name, sponsor_person.last_name AS sponsor_last_name, proj.project_cost, phases.phase_name FROM projects proj LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk LEFT JOIN phases ON phases.id = proj.phase_id_fk WHERE proj.company_id_fk = ?";

    await db.sequelize
      .query(query, {
        replacements: [company_id_fk],
        type: db.sequelize.QueryTypes.SELECT,
      })

      .then((data) => {
        console.log("data:", data);
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
    proj.effort,
    proj.project_why,
    proj.project_what,
    prime_person.first_name AS prime_first_name, 
    prime_person.last_name AS prime_last_name, 
    sponsor_person.first_name AS sponsor_first_name, 
    sponsor_person.last_name AS sponsor_last_name, 
    proj.project_cost, 
    phases.phase_name,
    proj.prime_id_fk
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
    console.log("data:", data);
    let changed_projects;
    try {
      changed_projects = await db.changed_projects.findAll({
        where: {
          project_id_fk: project_id,
          company_id_fk: company_id_fk,
        },
        order: [["change_date", "DESC"]],
      });
      if (changed_projects) {
      }
    } catch (error) {
      console.log("Cockpit Changed Projects error:", error);
    }
    // Fetch tags for each project
    const formattedTags =
      data[0].tag_1_name +
      ", " +
      data[0].tag_2_name +
      ", " +
      data[0].tag_3_name;
    console.log("formattedTags:", data.tag_1_name);
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

    res.render("Pages/pages-cockpit", {
      project: data,
      current_date: currentDate,
      formattedCost: data[0].project_cost,
      statuses: statuses,
      statusColor: statusColor,
      changed_projects,
      tags: tagsData,
      formattedTags,
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
      res.redirect("Pages/pages-500");
    }

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
      proj.tag_3
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
      let tagsData = await Tag.findAll({
        where: {
          [Op.or]: [{ company_id_fk: company_id_fk }, { company_id_fk: 0 }],
        },
        order: [["id", "ASC"]],
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

      const formattedTags = `${data[0].tag_1}, ${data[0].tag_2}, ${data[0].tag_3}`;
      console.log("formattedTags:", formattedTags);
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
        formattedTags: formattedTags,
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
  try {
    const project_id = req.params.id;

    // Ensure session exists and fetch company ID
    if (!req.session || !req.session.company) {
      return res.redirect("/pages-500");
    }

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
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      message: "An unexpected error occurred.",
    });
  }
};

// exports.findFunnel = async (req, res) => {
//   console.log("IN THIS 2");
//   try {
//     const company_id_fk = req.session.company.id;
//     // Retrieve projects related to the company
//     const projects = await Project.findAll({
//       where: { company_id_fk: company_id_fk, phase_id_fk: 1 },
//     });
//     console.log("************************************* projects ", projects);
//     // Calculate pitch count, total cost, and total effort
//     const pitchCount = projects.length;
//     let pitchTotalCost = 0;
//     let pitchTotalPH = 0;

//     const tagsData = await Tag.findAll({
//       where: { company_id_fk: company_id_fk },
//       order: [["id", "ASC"]],
//     });
//     projects.forEach((project) => {
//       pitchTotalCost += parseFloat(project.project_cost) || 0;
//       pitchTotalPH += parseFloat(project.effort) || 0;
//     });

//     // Render the funnel page with the retrieved data
//     res.render("Pages/pages-funnel", {
//       phases: phases,
//       projects: projects,
//       // pitchCount: pitchCount,
//       pitchTotalCost: pitchTotalCost,
//       pitchTotalPH: pitchTotalPH,
//       tags: tagsData,
//     });
//   } catch (error) {
//     console.error("Error finding funnel:", error);
//     res.status(500).json({ message: "Error finding funnel" });
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
  console.log();
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
    console.log("Data:", data);
    // Pass the result to the EJS template
    const pitchCount = Number(data[0].phase_1_count);
    const priorityCount = Number(data[0].phase_2_count);
    const discoveryCount = Number(data[0].phase_3_count);
    const deliveryCount = Number(data[0].phase_3_count);
    const operationsCount = Number(data[0].phase_4_count);
    const pitchTotalCost = formatCost(Number(data[0].phase_1_total_cost) || 0);
    const priorityTotalCost = formatCost(
      Number(data[0].phase_2_total_cost) || 0,
    );
    const discoveryCost = formatCost(Number(data[0].phase_3_total_cost) || 0);
    const deliveryTotalCost = formatCost(
      Number(data[0].phase_4_total_cost) || 0,
    );
    const operationsTotalCost = formatCost(
      Number(data[0].phase_5_total_cost) || 0,
    );
    const totalCost =
      pitchTotalCost +
      discoveryCost +
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
      projects: data,
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
      operationsTotalCost: formatCost(operationsTotalCost),
      totalCost,
      usedCost,
      avalCost,
      deliveryCount,
      deliveryCost: formatCost(deliveryTotalCost),
      discoveryCost: formatCost(deliveryTotalCost),
      currentDate: new Date().toLocaleDateString(),
      company_id: company_id_fk,
    });
  } catch (error) {
    console.log("Query error:", error);
    return res.status(500).send({ message: "Server error" });
  }
};

exports.progress = async (req, res) => {
  let companyId;

  // Ensure session exists and extract company information
  try {
    if (!req.session || !req.session.company) {
      return res.redirect("/pages-500");
    } else {
      companyId = req.session.company.id;
    }
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).send({ message: "Server error" });
  }

  try {
    // Get all projects for the company
    const projects = await db.projects.findAll({
      where: { company_id_fk: companyId },
      attributes: ["id", "project_name"],
    });

    if (!projects || projects.length === 0) {
      return res
        .status(404)
        .send({ message: "No projects found for this company." });
    }

    // Get the most recent status for each project
    const projectNames = [];
    const progress = [];
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
    }

    // Send the response
    res.json({
      company_name: req.session.company.company_name,
      project_names: projectNames,
      progress: progress,
      colors: colors,
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

  const data = await db.sequelize.query(query, {
    replacements: [company_id_fk],
    type: db.sequelize.QueryTypes.SELECT,
  });

  // // Render the page with the query results
  // res.render("Pages/pages-flight-plan", {
  //   projects: data,
  //   currentDate: moment().format("MMMM Do YYYY"),
  //   // other data you need to pass to the template
  // });

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
      projects: data,
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

    const personsData = await Person.findAll({
      where: {
        company_id_fk: company_id_fk, // Replace `specificCompanyId` with the actual value or variable
      },
    });

    let tagsData = await Tag.findAll({
      where: {
        [Op.or]: [{ company_id_fk: company_id_fk }, { company_id_fk: 0 }],
      },
      order: [["id", "ASC"]],
    });
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

    // Calculate pitch count, total cost, and total effort
    const pitchCount = data.length;
    let pitchTotalCost = 0;
    let pitchTotalPH = 0;

    data.forEach((project) => {
      pitchTotalCost = parseFloat(project.project_cost.replace(/,/g, "")) || 0;
      // pitchTotalCost += parseFloat(project.project_cost) || 0;
      console.log("project.cost:", pitchTotalCost);
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
    // console.log("Pitch Count:", pitchCount);
    // console.log("Total Cost:", pitchTotalCost);
    // console.log("Total Effort:", pitchTotalPH);
    pitchTotalCost = formatCost(pitchTotalCost);
    pitchTotalPH = formatCost(pitchTotalPH);
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
    });
  } catch (error) {
    console.error("Error finding funnel:", error);
    res.status(500).json({ message: "Error finding funnel" });
  }
};
exports.health = async (req, res) => {
  //get all company projects
  const companyProjects = await Project.findAll({
    where: { company_id_fk: company_id_fk },
  });
  console.log("PROJECTS:", companyProjects);
  res.render("Pages/pages-health", {
    projects: companyProjects,
    currentDate: moment().format("MMMM Do YYYY"),
  });
};

// Update a Project by the id in the request
exports.update = async (req, res) => {
  try {
    console.log(req.body);
    // Parse and assign the project cost
    const projectCost = parseFloat(req.body.project_cost);
    console.log("PROJECT COST1:", req.body.project_cost);
    if (isNaN(projectCost)) {
      return res.status(400).send({
        message: "Invalid project cost. Please enter a valid number.",
      });
    }
    console.log("PROJECT COST2:", projectCost);
    // Ensure session exists and fetch company ID
    const id = req.params.id;
    if (!req.session || !req.session.company) {
      return res.redirect("/pages-500");
    }
    const company_id_fk = req.session.company.id;

    // Initialize startDate, endDate, and nextMilestoneDate
    let startDateTest = null,
      endDateTest = null,
      nextMilestoneDateTest = null;

    // Convert dates

    startDateTest = insertValidDate(req.body.start_date);
    endDateTest = insertValidDate(req.body.end_date);
    nextMilestoneDateTest = insertValidDate(req.body.next_milestone_date);

    const [updated] = await Project.update(
      {
        start_date: startDateTest ? startDateTest.toDate() : null,
        end_date: endDateTest ? endDateTest.toDate() : null,
        next_milestone_date: nextMilestoneDateTest
          ? nextMilestoneDateTest.toDate()
          : null,
        company_id_fk: company_id_fk,
        project_name: req.body.project_name,
        project_headline: req.body.project_headline,
        project_description: req.body.project_description,
        project_why: req.body.project_why,
        project_what: req.body.project_what,
        phase_id_fk: req.body.phase_id_fk,
        priority_id_fk: req.body.priority_id_fk,
        sponsor_id_fk: req.body.sponsor_id_fk,
        prime_id_fk: req.body.prime_id_fk,
        phase_id_fk: req.body.phase_id_fk,
        impact: req.body.impact,
        complexity: req.body.complexity,
        effort: req.body.effort,
        benefit: req.body.benefit,
        project_cost: req.body.project_cost, // Assign the parsed project cost
        change_reason_id_fk: req.body.change_reason,
        change_explanation: req.body.change_explanation,
        tag_1: req.body.tag_1 || 1,
        tag_2: req.body.tag_2 || 1,
        tag_3: req.body.tag_3 || 1,
      },
      {
        where: { id: id, company_id_fk: company_id_fk },
      },
    );

    if (updated) {
      // Create a new ChangedProject entry
      const newChangedProject = {
        project_id_fk: id,
        company_id_fk: company_id_fk,
        change_date: new Date(),
        project_name: req.body.project_name,
        project_headline: req.body.project_headline,
        project_description: req.body.project_description,
        project_why: req.body.project_why,
        project_what: req.body.project_what,
        priority_id_fk: req.body.priority_id_fk,
        sponsor_id_fk: req.body.sponsor_id_fk,
        prime_id_fk: req.body.prime_id_fk,
        phase_id_fk: req.body.phase_id_fk,
        impact: req.body.impact,
        complexity: req.body.complexity,
        effort: req.body.effort ?? 0,
        benefit: req.body.benefit ?? 0,
        project_cost: req.body.project_cost,
        change_reason_id_fk: req.body.change_reason,
        change_explanation: req.body.change_explanation,
        tag_1: req.body.tag_1 || 1,
        tag_2: req.body.tag_2 || 1,
        tag_3: req.body.tag_3 || 1,
      };

      const changedProject = await ChangeProject.create(newChangedProject);

      if (changedProject) res.redirect("/");
    } else {
      res.status(404).send({
        message: `Cannot update Project with id=${id}. Maybe Project was not found or req.body is empty!`,
      });
    }
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
// Helper function to insert valid date
function insertValidDate(date) {
  return date ? moment.tz(date, "YYYY-MM-DD", "UTC") : null;
}
const formatCost = (cost) => {
  if (cost === null || cost === undefined) return "0";
  if (cost >= 1_000_000_000) return `${(cost / 1_000_000_000).toFixed(1)}B`;
  if (cost >= 1_000_000) return `${(cost / 1_000_000).toFixed(1)}M`;
  if (cost >= 1_000) return `${(cost / 1_000).toFixed(1)}K`;
  return cost.toString();
};
