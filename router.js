var express = require("express");
var router = express.Router();

const db = require("./models");
const Project = db.projects;
const Op = db.Sequelize.Op;

// Dashboard
router.get("/", async function (req, res) {
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

    // Prepare custom SQL query
    const query = `
            SELECT proj.company_id_fk, proj.id, proj.project_name, proj.start_date, proj.end_date,
                   proj.health, proj.effort AS effort, prime_person.first_name AS prime_first_name,
                   prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name,
                   sponsor_person.last_name AS sponsor_last_name, proj.project_cost, phases.phase_name 
            FROM projects proj
            LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk
            LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk
            LEFT JOIN phases ON phases.id = proj.phase_id_fk
            WHERE proj.company_id_fk = ? ORDER BY proj.phase_id_fk;`;

    // Initialize cost and effort-related totals
    let totalCost = 0,
      usedCost = 0,
      availableCost = 0,
      totalPH = 0;
    let totalPitchCount = 0,
      totalPitchCost = 0,
      totalPitchPH = 0;
    let totalPriorityCount = 0,
      totalPriorityCost = 0,
      totalPriorityPH = 0;
    let totalDiscoveryCount = 0,
      totalDiscoveryCost = 0,
      totalDiscoveryPH = 0;
    let totalDeliveryCount = 0,
      totalDeliveryCost = 0,
      totalDeliveryPH = 0;
    let totalOperationsCount = 0,
      totalOperationsCost = 0,
      totalOperationsPH = 0;

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

      // Categorize and sum based on phase name
      switch (project.phase_name.toLowerCase()) {
        case "pitch":
          totalPitchCount++;
          totalPitchCost += projectCost;
          totalPitchPH += projectEffortPH;
          break;
        case "priority":
          totalPriorityCount++;
          totalPriorityCost += projectCost;
          totalPriorityPH += projectEffortPH;
          break;
        case "discovery":
          totalDiscoveryCount++;
          totalDiscoveryCost += projectCost;
          totalDiscoveryPH += projectEffortPH;
          break;
        case "delivery":
          totalDeliveryCount++;
          totalDeliveryCost += projectCost;
          totalDeliveryPH += projectEffortPH;
          break;
        case "done":
          totalOperationsCount++;
          totalOperationsCost += projectCost;
          totalOperationsPH += projectEffortPH;
          break;
        default:
          console.log("Unknown phase: " + project.phase_name);
      }
    });

    // Finalize cost and effort calculations
    usedCost = totalCost - totalOperationsCost;
    availableCost = totalCost - usedCost;

    // Format values for display
    function formatValue(value) {
      return (value || 0).toLocaleString("en-US");
    }
    if (isAdmin) {
      console.log("we have an admin: ", person);
      // Render the dashboard page
      res.render("Dashboard/dashboard1", {
        projects: data,
        totalPitchCount,
        pitchTotalCost: formatCost(totalPitchCost),
        priorityCount: formatValue(totalPriorityCount),
        priorityTotalCost: formatCost(totalPriorityCost),
        totalPitchPH,
        discoveryCount: formatValue(totalDiscoveryCount),
        totalDiscoveryCost: formatCost(totalDiscoveryCost),
        totalDeliveryCount: formatValue(totalDeliveryCount),
        deliveryTotalCost: formatCost(totalDeliveryCost),
        totalOperationsCount: formatValue(totalOperationsCount),

        totalCost: formatCost(totalCost),
        priorityTotalPH: formatValue(totalPriorityPH),
        deliveryTotalPH: formatValue(totalDeliveryPH),
        discoveryTotalPH: formatValue(totalDiscoveryPH),
        operationsTotalPH: formatValue(totalOperationsPH),
        totalPH: formatValue(totalPH),
        totalUsedPH: formatValue(totalPH - totalOperationsPH),
        totalAvailPH: formatValue(totalPH - (totalPH - totalOperationsPH)),
        totalPitchPH: formatValue(totalPitchPH),
        usedCost: formatCost(availableCost),
        availableCost: formatCost(usedCost),
        totalOperationsCost: formatCost(totalOperationsCost),
        session: req.session,
      });
    } else {
      //load prime projects for status updates
      console.log(
        "$$$$$$$$$$$$$$$$$$$$$$ get projects for primes or sponsors (read only)",
      );
      const query = `
            SELECT 
                projects.*,
                prime_person.first_name AS prime_first_name,
                prime_person.last_name AS prime_last_name,
                sponsor_person.first_name AS sponsor_first_name,
                sponsor_person.last_name AS sponsor_last_name
            FROM 
                projects
            LEFT JOIN 
                persons AS prime_person ON projects.prime_id_fk = prime_person.id
            LEFT JOIN 
                persons AS sponsor_person ON projects.sponsor_id_fk = sponsor_person.id
            WHERE 
                projects.prime_id_fk = ?;`;
      // Execute custom SQL query
      const data = await db.sequelize.query(query, {
        replacements: [person.id],
        type: db.sequelize.QueryTypes.SELECT,
      });

      // Render the dashboard page
      res.render("Dashboard/dashboard2", {
        projects: data,
        session: req.session,
      });
    }
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
