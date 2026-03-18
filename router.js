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

// Function to remove commas and convert to number
function removeCommasAndConvert(numStr) {
  if (typeof numStr !== "string") {
    numStr = numStr.toString();
  }
  return parseFloat(numStr.replace(/,/g, ""));
}

router.get("/", isAdminMiddleware, async (req, res) => {
  const company_id_fk = req.session.company.id;

  // Extract date filter parameters from query string
  const filterStart = req.query.filter_start || null;
  const filterEnd = req.query.filter_end || null;

  // Build optional date filter clause
  let dateFilter = "";
  let queryParams = [company_id_fk];

  if (filterStart && filterEnd) {
    dateFilter = `AND proj.start_date >= ? AND proj.end_date <= ?`;
    queryParams.push(filterStart, filterEnd);
  } else if (filterStart) {
    dateFilter = `AND proj.start_date >= ?`;
    queryParams.push(filterStart);
  } else if (filterEnd) {
    dateFilter = `AND proj.end_date <= ?`;
    queryParams.push(filterEnd);
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
  latest_status.status_date AS latest_status_date,
  proj.tag_1, tag1.tag_name AS tag_1_name,
  proj.tag_2, tag2.tag_name AS tag_2_name,
  proj.tag_3, tag3.tag_name AS tag_3_name
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
LEFT JOIN tags tag1 ON tag1.id = proj.tag_1
LEFT JOIN tags tag2 ON tag2.id = proj.tag_2
LEFT JOIN tags tag3 ON tag3.id = proj.tag_3
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

    if (!data || data.length === 0) {
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
    const availablePHColor =
      isNaN(totalAvailPH) || totalAvailPH < 0 ? "red" : "green";
    const availableCostColor =
      isNaN(availableCost) || availableCost < 0 ? "red" : "green";
    // Calculate percentages for dashboard display
    const costPercentRaw = portfolio_budget > 0 ? Math.round((usedCost / portfolio_budget) * 100) : 0;
    const effortPercentRaw = portfolio_effort > 0 ? Math.round((usedEffort / portfolio_effort) * 100) : 0;
    const costPercentColor = costPercentRaw < 95 ? '#28a745' : (costPercentRaw <= 110 ? '#ffc107' : '#dc3545');
    const effortPercentColor = effortPercentRaw < 95 ? '#28a745' : (effortPercentRaw <= 110 ? '#ffc107' : '#dc3545');
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

    // Deduplicate projects by ID
    const uniqueProjects = [];
    const seenIds = new Set();
    for (const project of data) {
      if (!seenIds.has(project.id)) {
        uniqueProjects.push(project);
        seenIds.add(project.id);
      }
    }

    // Collect unique tags used across filtered projects
    const seenTagIds = new Set();
    const usedTags = [];
    for (const project of uniqueProjects) {
      [[project.tag_1, project.tag_1_name], [project.tag_2, project.tag_2_name], [project.tag_3, project.tag_3_name]].forEach(([id, name]) => {
        if (id && id != 0 && name && !seenTagIds.has(id)) {
          seenTagIds.add(id);
          usedTags.push({ id, tag_name: name });
        }
      });
    }

    const portfolioName = req.session.company.company_headline;
    res.render("Dashboard/dashboard1", {
      company_id: company_id_fk,
      projects: uniqueProjects,
      ...formattedData,
      availableCostColor,
      availablePHColor,
      costPercentRaw,
      effortPercentRaw,
      costPercentColor,
      effortPercentColor,
      portfolioName,
      phases,
      priorities,
      sponsors: persons,
      primes: persons,
      tags: tagsData,
      usedTags,
      currentFilterStart: filterStart || "",
      currentFilterEnd: filterEnd || "",
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
