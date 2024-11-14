var express = require("express");
var router = express.Router();

const db = require("./models");
const Project = db.projects;
const Op = db.Sequelize.Op;

const isAdminMiddleware = require("./middleware/isAdminMiddleware");

// Dashboard
router.get("/", isAdminMiddleware, async function (req, res) {
  let company_id_fk;

  // Validate session and retrieve company_id_fk
  try {
    if (!req.session.company || !req.session.company.id) {
      throw new Error("Invalid session");
    }
    company_id_fk = req.session.company.id;
  } catch (error) {
    console.log("SESSION INVALID");
    return res.redirect("/login");
  }

  // Validate person and check if admin
  const person = req.session.person;
  if (!person) {
    return res.redirect("/login");
  }
  const isAdmin = person.isAdmin;

  try {
    // Fetch projects related to the company
    const projects = await Project.findAll({ where: { company_id_fk } });

    // Custom SQL query to retrieve detailed project info
    const query = `
      SELECT proj.company_id_fk, proj.id, proj.project_name, proj.start_date, proj.end_date,
             proj.health, proj.effort AS effort, prime_person.first_name AS prime_first_name,
             prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name,
             sponsor_person.last_name AS sponsor_last_name, proj.project_cost, phases.phase_name 
      FROM projects proj
      LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk
      LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk
      LEFT JOIN phases ON phases.id = proj.phase_id_fk
      WHERE proj.company_id_fk = ? 
      ORDER BY proj.phase_id_fk;`;

    // Initialize totals for costs and efforts
    let totalCost = 0,
      totalPH = 0;
    let phaseData = {
      pitch: { count: 0, cost: 0, ph: 0 },
      priority: { count: 0, cost: 0, ph: 0 },
      discovery: { count: 0, cost: 0, ph: 0 },
      delivery: { count: 0, cost: 0, ph: 0 },
      done: { count: 0, cost: 0, ph: 0 },
    };

    // Execute custom SQL query
    const data = await db.sequelize.query(query, {
      replacements: [company_id_fk],
      type: db.sequelize.QueryTypes.SELECT,
    });

    // Process data and calculate totals
    data.forEach((project) => {
      const projectCost =
        parseFloat(project.project_cost.replace(/,/g, "")) || 0;
      const projectEffortPH = parseInt(project.effort) || 0;

      totalCost += projectCost;
      totalPH += projectEffortPH;

      // Categorize by phase name and accumulate values
      const phase = project.phase_name.toLowerCase();
      if (phaseData[phase]) {
        phaseData[phase].count++;
        phaseData[phase].cost += projectCost;
        phaseData[phase].ph += projectEffortPH;
      } else {
        console.log("Unknown phase: " + project.phase_name);
      }
    });

    // Finalize cost and effort calculations
    const usedCost = totalCost - phaseData.done.cost;
    const availableCost = totalCost - usedCost;

    // Helper function for formatting values
    function formatValue(value) {
      return (value || 0).toLocaleString("en-US");
    }

    // Render the dashboard page
    res.render("Dashboard/dashboard1", {
      projects: data,
      totalCost: formatValue(totalCost),
      usedCost: formatValue(usedCost),
      availableCost: formatValue(availableCost),
      totalPH: formatValue(totalPH),
      totalUsedPH: formatValue(totalPH - phaseData.done.ph),
      totalAvailPH: formatValue(phaseData.done.ph),
      pitch: {
        count: formatValue(phaseData.pitch.count),
        cost: formatValue(phaseData.pitch.cost),
        ph: formatValue(phaseData.pitch.ph),
      },
      priority: {
        count: formatValue(phaseData.priority.count),
        cost: formatValue(phaseData.priority.cost),
        ph: formatValue(phaseData.priority.ph),
      },
      discovery: {
        count: formatValue(phaseData.discovery.count),
        cost: formatValue(phaseData.discovery.cost),
        ph: formatValue(phaseData.discovery.ph),
      },
      delivery: {
        count: formatValue(phaseData.delivery.count),
        cost: formatValue(phaseData.delivery.cost),
        ph: formatValue(phaseData.delivery.ph),
      },
      operations: {
        count: formatValue(phaseData.done.count),
        cost: formatValue(phaseData.done.cost),
        ph: formatValue(phaseData.done.ph),
      },
      session: req.session,
      priorityCount: formatValue(phaseData.priority.count),
      priorityTotalCost: formatValue(phaseData.priority.cost),
      priorityTotalPH: formatValue(phaseData.priority.ph),

      discoveryCount: formatValue(phaseData.discovery.count),
      totalDiscoveryCost: formatValue(phaseData.discovery.cost),
      discoveryTotalPH: formatValue(phaseData.discovery.ph),

      totalDeliveryCount: formatValue(phaseData.delivery.count),
      deliveryTotalCost: formatValue(phaseData.delivery.cost),
      deliveryTotalPH: formatValue(phaseData.delivery.ph),

      totalOperationsCount: formatValue(phaseData.done.count),
      operationsTotalCost: formatValue(phaseData.done.cost),
      operationsTotalPH: formatValue(phaseData.done.ph),

      totalPitchCount: formatValue(phaseData.pitch.count),
      pitchTotalCost: formatValue(phaseData.pitch.cost),
      totalPitchPH: formatValue(phaseData.pitch.ph),
    });
  } catch (error) {
    console.error("Error while fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

const formatCost = (cost) => {
  console.log("cost", cost);
  if (cost >= 1000000000) {
    return `${(cost / 1000000000).toFixed(1)}B`;
  }
  if (cost >= 1000000) {
    return `${(cost / 1000000).toFixed(1)}M`;
  }
  if (cost >= 1000) {
    return `${(cost / 1000).toFixed(1)}K`;
  }
  return 0;
};
// Helper function to format cost values

module.exports = router;
