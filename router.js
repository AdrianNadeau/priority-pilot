const express = require("express");
const router = express.Router();

const db = require("./models");
const Project = db.projects;
const Company = db.companies;
const { Op, fn, col, literal } = require("sequelize");
const { format } = require("sequelize/lib/utils");

// Function to format numbers with K, M, B
function formatToKMB(num) {
  if (typeof num !== "number") {
    num = parseFloat(num) || 0;
  }
  const isNegative = num < 0;
  num = Math.abs(num);
  if (num >= 1e9) return (isNegative ? "-" : "") + (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (isNegative ? "-" : "") + (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (isNegative ? "-" : "") + (num / 1e3).toFixed(2) + "K"; // No decimal if whole number
  return (isNegative ? "-" : "") + num.toFixed(2);
}

// Function to remove commas and convert to number
function removeCommasAndConvert(numStr) {
  if (typeof numStr !== "string") {
    numStr = numStr.toString();
  }
  return parseFloat(numStr.replace(/,/g, ""));
}

router.get("/", async (req, res) => {
  try {
    const company_id_fk = req.session.company?.id;
    if (!company_id_fk) {
      return res.redirect("/register");
    }

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
        companies.effort AS company_effort
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

    if (!data || data.length === 0) {
      console.log("No data found for company_id_fk:", company_id_fk);
      return res.redirect("/projects");
    }

    // Initialize phase data with default values
    const phaseData = {
      pitch: { count: 0, cost: 0, ph: 0 },
      planning: { count: 0, cost: 0, ph: 0 },
      discovery: { count: 0, cost: 0, ph: 0 },
      delivery: { count: 0, cost: 0, ph: 0 },
      done: { count: 0, cost: 0, ph: 0 },
    };

    // Retrieve portfolio_budget and portfolio_effort from the first record
    const portfolio_budget = data[0].company_budget
      ? removeCommasAndConvert(data[0].company_budget)
      : 0;

    const portfolio_effort = data[0].company_effort
      ? removeCommasAndConvert(data[0].company_effort)
      : 0;
    console.log("company_effort:", portfolio_effort);
    // Process data and calculate totals
    data.forEach((project) => {
      const projectCost = project.project_cost
        ? removeCommasAndConvert(project.project_cost) || 0
        : 0;
      const projectEffortPH = parseInt(project.effort) || 0;

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
        ph: phaseData.planning.ph.toLocaleString(),
      },
      discovery: {
        count: phaseData.discovery.count,
        cost: formatToKMB(phaseData.discovery.cost),
        ph: phaseData.discovery.ph.toLocaleString(),
      },
      delivery: {
        count: phaseData.delivery.count,
        cost: formatToKMB(phaseData.delivery.cost),
        ph: phaseData.delivery.ph.toLocaleString(),
      },
      operations: {
        count: phaseData.done.count,
        cost: formatToKMB(phaseData.done.cost),
        ph: phaseData.done.ph.toLocaleString(),
      },
      totalCost: formatToKMB(portfolio_budget),
      usedCost: formatToKMB(usedCost),
      availableCost: formatToKMB(availableCost),
      usedEffort: formatToKMB(usedEffort),
    };

    // Render dashboard with all calculated values
    res.render("Dashboard/dashboard1", {
      company_id: company_id_fk,
      projects: data,
      ...formattedData,
      availableCostColor,
      availablePHColor,
    });
  } catch (error) {
    console.error("Error while fetching data:", error.message, error.stack);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
