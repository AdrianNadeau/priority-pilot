const express = require("express");
const router = express.Router();

const db = require("./models");
const Project = db.projects;
const Company = db.companies;
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
    console.error("SESSION INVALID");
    return res.redirect("/login");
  }

  // Validate person and check if admin
  const person = req.session.person;
  if (!person) {
    return res.redirect("/login");
  }
  const isAdmin = person.isAdmin;

  try {
    // Get company by ID
    const company = await Company.findByPk(company_id_fk);
    if (!company) {
      throw new Error("Company not found");
    }

    console.log("WE HAVE COMPANYv2:", company);

    const portfolio_budget = convertToNumber(company?.portfolio_budget || 0);
    const portfolio_effort = convertToNumber(company?.effort || 0);

    // Custom SQL query to retrieve detailed project info
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
      LEFT JOIN 
        companies ON companies.id = proj.company_id_fk
      WHERE 
        proj.company_id_fk = ? 
      ORDER BY 
        proj.phase_id_fk;
    `;

    // Execute custom SQL query
    const data = await db.sequelize.query(query, {
      replacements: [company_id_fk],
      type: db.sequelize.QueryTypes.SELECT,
    });

    // Initialize phase data with default values
    const phaseData = {
      pitch: { count: 0, cost: 0, ph: 0 },
      priority: { count: 0, cost: 0, ph: 0 },
      discovery: { count: 0, cost: 0, ph: 0 },
      delivery: { count: 0, cost: 0, ph: 0 },
      done: { count: 0, cost: 0, ph: 0 },
    };

    let totalPH = 0;
    let usedCost = 0;

    // Process data and calculate totals
    data.forEach((project) => {
      const projectCost =
        parseFloat(project.project_cost.replace(/,/g, "")) || 0;
      const projectEffortPH = parseInt(project.effort) || 0;

      totalPH += projectEffortPH;

      // Categorize by phase name and accumulate values
      const phase = project.phase_name?.toLowerCase() || "unknown";
      if (phaseData[phase]) {
        phaseData[phase].count++;
        phaseData[phase].cost += projectCost;
        phaseData[phase].ph += projectEffortPH;
      } else {
        console.warn("Unknown phase:", project.phase_name);
      }
    });

    console.log("EFFORT:", portfolio_effort);

    // Calculate usedCost and availableCost
    usedCost =
      phaseData.priority.cost +
      phaseData.discovery.cost +
      phaseData.delivery.cost +
      phaseData.done.cost;

    usedEffort =
      phaseData.priority.ph +
      phaseData.discovery.ph +
      phaseData.delivery.ph +
      phaseData.done.ph;
    console.log("PORT:", portfolio_budget);
    console.log("USED:", usedCost);
    const availableCost = portfolio_budget - usedCost;

    const availableEffort = portfolio_effort - usedEffort;

    res.render("Dashboard/dashboard1", {
      projects: data,
      totalPH: formatCost(totalPH),
      totalAvailPH: formatCost(phaseData.done.ph),
      totalUsedPH: formatCost(totalPH - phaseData.done.ph),
      priorityCount: phaseData.priority.count,
      pitch: {
        count: formatValue(phaseData.pitch.count),
        cost: formatCost(phaseData.pitch.cost),
        ph: formatCost(phaseData.pitch.ph),
      },
      priority: {
        count: formatValue(phaseData.priority.count),
        cost: formatCost(phaseData.priority.cost),
        ph: formatCost(phaseData.priority.ph),
      },
      discovery: {
        count: formatValue(phaseData.discovery.count),
        cost: formatCost(phaseData.discovery.cost),
        ph: formatValue(phaseData.discovery.ph),
      },
      delivery: {
        count: formatValue(phaseData.delivery.count),
        cost: formatCost(phaseData.delivery.cost),
        ph: formatValue(phaseData.delivery.ph),
      },
      operations: {
        count: formatValue(phaseData.done.count),
        cost: formatCost(phaseData.done.cost),
        ph: formatValue(phaseData.done.ph),
      },
      portfolio_budget: formatCost(portfolio_budget),
      portfolio_effort: formatCost(portfolio_effort),
      usedCost: formatCost(usedCost),
      availableCost: formatCost(availableCost),
      totalAvailPH: formatCost(availableEffort),
    });
  } catch (error) {
    console.error("Error while fetching data:", error.message, error.stack);
    res.status(500).send("Internal Server Error");
  }
});

// Helper functions
const formatCost = (cost) => {
  if (cost === null || cost === undefined) return "0";
  if (cost >= 1_000_000_000) return `${(cost / 1_000_000_000).toFixed(1)}B`;
  if (cost >= 1_000_000) return `${(cost / 1_000_000).toFixed(1)}M`;
  if (cost >= 1_000) return `${(cost / 1_000).toFixed(1)}K`;
  return cost.toString();
};

const convertToNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string")
    return parseFloat(value.replace(/,/g, "")) || 0;
  return 0;
};

const formatValue = (value) => (value || 0).toLocaleString("en-US");

module.exports = router;
