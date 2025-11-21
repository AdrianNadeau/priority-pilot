const express = require("express");
const router = express.Router();
const moment = require("moment");
const isAdminMiddleware = require("./middleware/isAdminMiddleware");
const {
  applyGlobalFilter,
  buildDateFilter,
} = require("./middleware/globalFilterMiddleware");

const db = require("./models");
const Project = db.projects;
const Company = db.companies;
const Tag = db.tags;
const { Op, fn, col, literal, where } = require("sequelize");
const { format } = require("sequelize/lib/utils");

// Function to format numbers with commas (no K/M/B abbreviations)
function formatToKMB(num) {
  // Accept numbers or numeric strings; return full number with commas
  if (num === null || typeof num === "undefined" || num === "") return "0";
  if (typeof num !== "number") {
    const parsed = parseFloat(String(num).replace(/[^0-9.\-]/g, ""));
    if (isNaN(parsed)) return "0";
    num = parsed;
  }

  // Return full number with commas and no decimals for whole numbers
  const isWhole = num % 1 === 0;
  const formatted = isWhole
    ? Math.abs(num).toFixed(0)
    : Math.abs(num).toFixed(2);

  // Use toLocaleString for proper comma formatting
  const withCommas = parseFloat(formatted).toLocaleString("en-US");

  return num < 0 ? "-" + withCommas : withCommas;
}

// Function to format counts (always whole numbers, no decimals, with commas)
function formatCount(num) {
  if (num === null || typeof num === "undefined" || num === "") return "0";
  if (typeof num !== "number") {
    const parsed = parseInt(String(num).replace(/[^0-9\-]/g, ""));
    if (isNaN(parsed)) return "0";
    num = parsed;
  }
  const wholeNum = Math.floor(Math.abs(num));

  // Use toLocaleString for proper comma formatting
  const withCommas = wholeNum.toLocaleString("en-US");

  return num < 0 ? "-" + withCommas : withCommas;
}

// Function to remove commas and convert to number
function removeCommasAndConvert(numStr) {
  if (typeof numStr !== "string") {
    numStr = numStr.toString();
  }
  return parseFloat(numStr.replace(/,/g, ""));
}

// Helper function to calculate days between dates
function calculateFilteredDays(fromDate, toDate) {
  if (!fromDate || !toDate) return null;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffTime = Math.abs(to - from);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both dates
}

router.get("/", isAdminMiddleware, applyGlobalFilter, async (req, res) => {
  const company_id_fk = req.session.company.id;

  // Priority order: session values first, then query params, then database
  let fromDate = req.session.filtered_start || req.query.from_date;
  let toDate = req.session.filtered_end || req.query.to_date;

  // Handle null/empty values from clear button (treat as clearing filters)
  if (fromDate === "null" || fromDate === "" || fromDate === null) {
    fromDate = null;
  }
  if (toDate === "null" || toDate === "" || toDate === null) {
    toDate = null;
  }

  // If no filter values and user just loaded page, check database
  if (!fromDate || !toDate) {
    try {
      const currentUser = await db.persons.findByPk(req.session.person.id);
      if (currentUser) {
        if (!fromDate && currentUser.filtered_start) {
          fromDate = moment(currentUser.filtered_start).format("YYYY-MM-DD");
          req.session.filtered_start = fromDate; // Update session
        }
        if (!toDate && currentUser.filtered_end) {
          toDate = moment(currentUser.filtered_end).format("YYYY-MM-DD");
          req.session.filtered_end = toDate; // Update session
        }
        // Calculate filtered days when loading from user defaults
        req.session.filtered_days = calculateFilteredDays(fromDate, toDate);
      }
    } catch (error) {
      console.error("Error loading user filter data:", error);
    }
  }

  // Handle month-only format (YYYY-MM) for SQL queries
  if (fromDate && /^\d{4}-\d{2}$/.test(fromDate)) {
    fromDate = fromDate + "-01";
  }
  if (toDate && /^\d{4}-\d{2}$/.test(toDate)) {
    // For end date, use the last day of the month
    const [year, month] = toDate.split("-");
    const lastDay = new Date(year, month, 0).getDate();
    toDate = `${year}-${month}-${lastDay.toString().padStart(2, "0")}`;
  }

  // Get current user's milestone details from database - removed, column doesn't exist in persons table
  let currentMilestoneDetails = "";

  // Store filter values in session when they change
  if (fromDate || toDate) {
    req.session.filtered_start = fromDate;
    req.session.filtered_end = toDate;
    req.session.filtered_days = calculateFilteredDays(fromDate, toDate);

    // Update person model with filtered dates
    try {
      await db.persons.update(
        {
          filtered_start: fromDate || null,
          filtered_end: toDate || null,
          filtered_days: req.session.filtered_days || null,
        },
        {
          where: { id: req.session.person.id },
        },
      );
    } catch (error) {
      console.error("Error updating person filter dates:", error);
    }
  }

  // Build the WHERE clause for date filtering
  // Pitch (phase_id_fk = 1) and Archived (phase_id_fk = 6) projects should always be shown regardless of date filters
  let dateFilter = "";
  let queryParams = [company_id_fk];

  if (fromDate && toDate) {
    // Show projects that overlap with the filter period, but always include pitch and archived
    dateFilter = `AND (proj.phase_id_fk IN (1, 6) OR (proj.start_date <= ? AND proj.end_date >= ?))`;
    queryParams.push(toDate, fromDate);
  } else if (fromDate) {
    // Show projects that end on or after the from date, but always include pitch and archived
    dateFilter = `AND (proj.phase_id_fk IN (1, 6) OR proj.end_date >= ?)`;
    queryParams.push(fromDate);
  } else if (toDate) {
    // Show projects that start on or before the to date, but always include pitch and archived
    dateFilter = `AND (proj.phase_id_fk IN (1, 6) OR proj.start_date <= ?)`;
    queryParams.push(toDate);
  }

  const query = `
   SELECT DISTINCT 
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
  SELECT DISTINCT ON (project_id_fk) 
         project_id_fk, health, status_date
  FROM statuses s1
  WHERE s1.status_date = (
      SELECT MAX(status_date) 
      FROM statuses s2 
      WHERE s2.project_id_fk = s1.project_id_fk
  )
  ORDER BY project_id_fk, id DESC
) latest_status ON latest_status.project_id_fk = proj.id
WHERE 
  proj.company_id_fk = ? AND proj.deleted_yn = false ${dateFilter}
ORDER BY 
  proj.id;`;

  try {
    const data = await db.sequelize.query(query, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.SELECT,
    });

    const uniquePhases = [
      ...new Set(data.map((p) => p.phase_name).filter(Boolean)),
    ];

    // Count projects per phase before mapping
    const phaseCount = {};
    data.forEach((p) => {
      if (p.phase_name) {
        phaseCount[p.phase_name] = (phaseCount[p.phase_name] || 0) + 1;
      }
    });

    // If no data found, still render dashboard with empty state
    if (!data || data.length === 0) {
      // Get required data for empty dashboard render
      const phases = await db.phases.findAll({
        order: [["id", "ASC"]],
        distinct: true,
      });
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
        filteredDays: req.session.filtered_days || null,
      });
    }

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

    // Function to map phase names to our internal phase keys
    function mapPhaseToKey(phaseName) {
      if (!phaseName) return "unknown";
      const lowerPhase = phaseName.toLowerCase().trim();

      // Map various phase names to our internal keys
      const phaseMapping = {
        pitch: "pitch",
        funnel: "pitch", // Map Funnel to Pitch
        pitching: "pitch",
        idea: "pitch",
        planning: "planning",
        plan: "planning",
        discovery: "discovery",
        discover: "discovery",
        analysis: "discovery",
        delivery: "delivery",
        develop: "delivery",
        development: "delivery",
        implementation: "delivery",
        done: "done",
        complete: "done",
        completed: "done",
        finished: "done",
        operations: "done", // Map Operations to Done
        archived: "archived",
        archive: "archived",
        closed: "archived",
        cancelled: "archived",
      };

      return phaseMapping[lowerPhase] || "unknown";
    }

    // Process data and calculate totals
    const seenProjectIds = new Set(); // Track processed projects to avoid duplicates
    let pitchProjects = []; // Track pitch projects for debugging

    data.forEach((project) => {
      // Skip if we've already processed this project (prevents duplicates)
      if (seenProjectIds.has(project.id)) {
        return;
      }
      seenProjectIds.add(project.id);

      // Parse project cost and effort
      const projectCost = project.project_cost
        ? removeCommasAndConvert(project.project_cost) || 0
        : 0;

      const projectEffortPH = project.effort
        ? removeCommasAndConvert(project.effort) || 0
        : 0;

      // Categorize by phase name and accumulate values
      const phase = mapPhaseToKey(project.phase_name);

      if (phaseData[phase]) {
        phaseData[phase].count++;
        phaseData[phase].cost += projectCost;
        phaseData[phase].ph += projectEffortPH;

        // Track pitch projects for debugging
        if (phase === "pitch") {
          pitchProjects.push({
            id: project.id,
            name: project.project_name,
            phase_name: project.phase_name,
          });
        }
      } else {
        console.warn(
          "Unknown phase after mapping:",
          project.phase_name,
          "->",
          phase,
        );
      }
    });

    // Calculate used values (from filtered projects only)
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

    const formattedData = {
      totalPH: formatToKMB(portfolio_effort),
      totalUsedPH: formatToKMB(usedEffort),
      totalAvailPH: formatToKMB(totalAvailPH),
      pitch: {
        count: formatCount(phaseData.pitch.count),
        cost: "0", // Force cost to 0 as requested
        ph: formatToKMB(phaseData.pitch.ph),
      },
      planning: {
        count: formatCount(phaseData.planning.count),
        cost: formatToKMB(phaseData.planning.cost),
        ph: formatToKMB(phaseData.planning.ph),
      },
      discovery: {
        count: formatCount(phaseData.discovery.count),
        cost: formatToKMB(phaseData.discovery.cost),
        ph: formatToKMB(phaseData.discovery.ph),
      },
      delivery: {
        count: formatCount(phaseData.delivery.count),
        cost: formatToKMB(phaseData.delivery.cost),
        ph: formatToKMB(phaseData.delivery.ph),
      },
      operations: {
        count: formatCount(phaseData.done.count),
        cost: formatToKMB(phaseData.done.cost),
        ph: formatToKMB(phaseData.done.ph),
      },
      archived: {
        count: formatCount(phaseData.archived.count),
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
      availableEffort: formatToKMB(totalAvailPH),
      totalEffort: formatToKMB(portfolio_effort),
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
      filteredDays: req.session.filtered_days || null,
      currentMilestoneDetails: currentMilestoneDetails,
    });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).send("Internal Server Error");
  }
});

// POST route to update user filter preferences and milestone details
router.post("/update-filter", isAdminMiddleware, async (req, res) => {
  try {
    let { from_date, to_date, next_milestone_date_details } = req.body;
    const personId = req.session.person.id;

    // Handle month-only format (YYYY-MM) by adding the first day of the month
    if (from_date && /^\d{4}-\d{2}$/.test(from_date)) {
      from_date = from_date + "-01";
    }
    if (to_date && /^\d{4}-\d{2}$/.test(to_date)) {
      // For end date, use the last day of the month
      const [year, month] = to_date.split("-");
      const lastDay = new Date(year, month, 0).getDate();
      to_date = `${year}-${month}-${lastDay.toString().padStart(2, "0")}`;
    }

    // Update person model with filtered dates
    await db.persons.update(
      {
        filtered_start: from_date || null,
        filtered_end: to_date || null,
        filtered_days: calculateFilteredDays(from_date, to_date) || null,
      },
      {
        where: { id: personId },
      },
    );

    // Store filter values in session (like previous versions)
    if (from_date === null || from_date === undefined) {
      delete req.session.filtered_start;
    } else {
      req.session.filtered_start = from_date;
    }

    if (to_date === null || to_date === undefined) {
      delete req.session.filtered_end;
    } else {
      req.session.filtered_end = to_date;
    }

    // Calculate and store filtered days
    req.session.filtered_days = calculateFilteredDays(
      req.session.filtered_start,
      req.session.filtered_end,
    );

    // Temporarily disabled milestone details until database column is added
    /*
    if (
      next_milestone_date_details === null ||
      next_milestone_date_details === undefined
    ) {
      delete req.session.next_milestone_date_details;
    } else {
      req.session.next_milestone_date_details = next_milestone_date_details;
    }
    */

    res.json({
      success: true,
      message: "Filter preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating filter preferences:", error);
    res.status(500).json({
      success: false,
      message: "Error updating filter preferences",
    });
  }
});

router.get("/terms", (req, res) => {
  res.render("Pages/pages-terms", { layout: "layout-public" });
});

module.exports = router;
