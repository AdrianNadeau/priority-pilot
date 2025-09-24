const express = require("express");
const router = express.Router();
const isAdminMiddleware = require("./middleware/isAdminMiddleware");

const db = require("./models");
const Project = db.projects;
const Company = db.companies;
const Tag = db.tags;
const { Op, fn, col, literal, where } = require("sequelize");
const { format } = require("sequelize/lib/utils");

// Function to format numbers with K, M, B
function formatToKMB(num) {
  // Accept numbers or numeric strings; return a formatted string with two decimals and suffix
  if (num === null || typeof num === "undefined" || num === "") return "0.00";
  if (typeof num !== "number") {
    const parsed = parseFloat(String(num).replace(/[^0-9.\-]/g, ""));
    if (isNaN(parsed)) return "0.00";
    num = parsed;
  }
  const isNegative = num < 0;
  const abs = Math.abs(num);
  const sign = isNegative ? "-" : "";

  if (abs >= 1e9) {
    return sign + (abs / 1e9).toFixed(2) + "B";
  }
  if (abs >= 1e6) {
    return sign + (abs / 1e6).toFixed(2) + "M";
  }
  if (abs >= 1e3) {
    return sign + (abs / 1e3).toFixed(2) + "K";
  }
  return sign + abs.toFixed(2);
}

// Function to remove commas and convert to number
function removeCommasAndConvert(numStr) {
  if (typeof numStr !== "string") {
    numStr = numStr.toString();
  }
  return parseFloat(numStr.replace(/,/g, ""));
}

router.get("/", isAdminMiddleware, async (req, res) => {
  const company_id_fk = req.session.company.id;

  // Extract date parameters from query string
  const fromDate = req.query.from_date;
  const toDate = req.query.to_date;

  // Build the WHERE clause for date filtering
  let dateFilter = "";
  let queryParams = [company_id_fk];

  if (fromDate && toDate) {
    dateFilter = `AND proj.start_date >= ? AND proj.end_date <= ?`;
    queryParams.push(fromDate, toDate);
  } else if (fromDate) {
    dateFilter = `AND proj.start_date >= ?`;
    queryParams.push(fromDate);
  } else if (toDate) {
    dateFilter = `AND proj.end_date <= ?`;
    queryParams.push(toDate);
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
  companies.company_headline AS portfolio_name,
  companies.effort AS company_effort,
  latest_status.health AS latest_status_health,
  latest_status.status_date AS latest_status_date
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
  proj.company_id_fk = ? ${dateFilter}
ORDER BY 
  proj.phase_id_fk;`;

  try {
    const data = await db.sequelize.query(query, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.SELECT,
    });

    // If no data found, still render dashboard with empty state
    if (!data || data.length === 0) {
      console.log(
        "No data found for company_id_fk:",
        company_id_fk,
        "with date filters:",
        { fromDate, toDate },
        "rendering empty dashboard",
      );

      // Get required data for empty dashboard render
      const phases = await db.phases.findAll({ order: [["id", "ASC"]] });
      const priorities = await db.priorities.findAll({});
      const persons = await db.persons.findAll({ where: { company_id_fk } });
      let tagsData = await Tag.findAll({
        where: { company_id_fk: company_id_fk },
        order: [["id", "ASC"]],
      });
      tagsData = [{ id: 0, tag_name: "None" }, ...tagsData];

      // Get company info for empty state
      const company = await Company.findByPk(company_id_fk);
      const portfolioName = company ? company.company_headline : "Portfolio";

      // Render dashboard with empty data
      return res.render("Dashboard/dashboard1", {
        pageTitle: "Dashboard",
        company_id: company_id_fk,
        projects: [],
        // Empty phase data
        pitch: { count: 0, cost: "0.00", ph: "0.00" },
        planning: { count: 0, cost: "0.00", ph: "0.00" },
        discovery: { count: 0, cost: "0.00", ph: "0.00" },
        delivery: { count: 0, cost: "0.00", ph: "0.00" },
        operations: { count: 0, cost: "0.00", ph: "0.00" },
        archived: { count: 0, cost: "0.00", ph: "0.00" },
        // Empty budget data
        totalCost: "0.00",
        usedCost: "0.00",
        availableCost: "0.00",
        totalPH: "0.00",
        totalUsedPH: "0.00",
        totalAvailPH: "0.00",
        totalCostPercent: "0%",
        usedCostPercent: "0%",
        availableCostPercent: "0%",
        totalEffortPercent: "0%",
        usedEffortPercent: "0%",
        availableEffortPercent: "0%",
        usedEffort: "0.00",
        availableCostColor: "text-success",
        availablePHColor: "text-success",
        portfolioName,
        phases,
        priorities,
        sponsors: persons,
        primes: persons,
        tags: tagsData,
        // Pass current filter values back to template
        currentFromDate: fromDate || "",
        currentToDate: toDate || "",
      });
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

    // Retrieve portfolio_budget and portfolio_effort from the first record
    const portfolio_budget = data[0].company_budget
      ? removeCommasAndConvert(data[0].company_budget)
      : 0;

    const portfolio_effort = data[0].company_effort
      ? removeCommasAndConvert(data[0].company_effort)
      : 0;

    // Process data and calculate totals
    data.forEach((project) => {
      // Parse project cost and effort
      const projectCost = project.project_cost
        ? removeCommasAndConvert(project.project_cost) || 0
        : 0;

      const projectEffortPH = project.effort
        ? removeCommasAndConvert(project.effort) || 0
        : 0;

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
    // Use Bootstrap text classes so views can style consistently
    const availablePHColor =
      isNaN(totalAvailPH) || totalAvailPH < 0 ? "text-danger" : "text-success";
    const availableCostColor =
      isNaN(availableCost) || availableCost < 0
        ? "text-danger"
        : "text-success";

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
      totalCostPercent:
        portfolio_budget && !isNaN(portfolio_budget) ? "100%" : "0%",
      usedCostPercent:
        portfolio_budget && !isNaN(portfolio_budget)
          ? ((usedCost / portfolio_budget) * 100).toFixed(1) + "%"
          : "0%",
      availableCostPercent:
        portfolio_budget && !isNaN(portfolio_budget)
          ? ((availableCost / portfolio_budget) * 100).toFixed(1) + "%"
          : "0%",
      // Effort percent fields (mirror cost percent behavior)
      totalEffortPercent:
        portfolio_effort && !isNaN(portfolio_effort) ? "100%" : "0%",
      usedEffortPercent:
        portfolio_effort && !isNaN(portfolio_effort)
          ? ((usedEffort / portfolio_effort) * 100).toFixed(1) + "%"
          : "0%",
      availableEffortPercent:
        portfolio_effort && !isNaN(portfolio_effort)
          ? ((totalAvailPH / portfolio_effort) * 100).toFixed(1) + "%"
          : "0%",
      usedEffort: formatToKMB(usedEffort),
    };

    //get all phases for add project modal (ordered by id)
    const phases = await db.phases.findAll({ order: [["id", "ASC"]] });
    //get all priorities for add project modal
    const priorities = await db.priorities.findAll({});
    //get all persons for primes and sponsors add project modal
    const persons = await db.persons.findAll({ where: { company_id_fk } });
    // Fetch tags

    let tagsData = await Tag.findAll({
      where: { company_id_fk: company_id_fk },
      order: [["id", "ASC"]],
    });

    // Add "None" option at the top of the tags list
    tagsData = [{ id: 0, tag_name: "None" }, ...tagsData];
    // Deduplicate projects by ID and ensure admin flags
    const uniqueProjects = [];
    const seenIds = new Set();
    const currentPerson =
      req.session && req.session.person ? req.session.person : null;
    for (const project of data) {
      if (!seenIds.has(project.id)) {
        const canModify = currentPerson ? !!currentPerson.isAdmin : false;
        uniqueProjects.push({
          ...project,
          can_update_status: canModify,
          can_view: true,
        });
        seenIds.add(project.id);
      }
    }

    const portfolioName = req.session.company.company_headline;
    res.render("Dashboard/dashboard1", {
      pageTitle: "Dashboard",
      company_id: company_id_fk,
      projects: uniqueProjects,
      ...formattedData,
      availableCostColor,
      availablePHColor,
      portfolioName,
      phases,
      priorities,
      sponsors: persons,
      primes: persons,
      tags: tagsData,
      totalCostPercent: formattedData.totalCostPercent,
      // Pass current filter values back to template
      currentFromDate: fromDate || "",
      currentToDate: toDate || "",
    });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/terms", (req, res) => {
  res.render("Pages/pages-terms", { layout: "layout-public" });
});

module.exports = router;
