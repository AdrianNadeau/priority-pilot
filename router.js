var express = require("express");
var router = express.Router();

const db = require("./models");
const Project = db.projects;
const Op = db.Sequelize.Op;

// Dashboard route
router.get("/", async function (req, res) {
  let company_id_fk;
  let pitchCount = 0, pitchTotalCost = 0;
  let priorityCount = 0, priorityTotalCost = 0, priorityTotalPH = 0;
  let discoveryCount = 0, discoveryTotalCost = 0, discoveryTotalPH = 0;
  let deliveryCount = 0, deliveryTotalCost = 0, deliveryTotalPH = 0;
  let operationsCount = 0, operationsTotalCost = 0, operationsTotalPH = 0;
  let totalEstimatedCost = 0;
  let totalEffortPH = 0;

  try {
    // Check if session exists and contains a company ID
    if (!req.session || !req.session.company || !req.session.company.id) {
      throw new Error("Session does not contain a valid company ID");
    }
    company_id_fk = req.session.company.id;
  } catch (error) {
    console.error("Session Error: ", error);
    return res.redirect("/login"); // Redirect to login if session is invalid
  }

  // Custom SQL query
  const query = `
        SELECT proj.company_id_fk, proj.id, proj.project_name, proj.start_date, proj.end_date, proj.health, 
        proj.effort, prime_person.first_name AS prime_first_name, prime_person.last_name AS prime_last_name, 
        sponsor_person.first_name AS sponsor_first_name, sponsor_person.last_name AS sponsor_last_name, 
        proj.project_cost, phases.phase_name 
        FROM projects proj 
        LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk 
        LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk 
        LEFT JOIN phases ON phases.id = proj.phase_id_fk 
        WHERE proj.company_id_fk = ?`;

  try {
    // Execute the SQL query
    const data = await db.sequelize.query(query, {
      replacements: [company_id_fk],
      type: db.sequelize.QueryTypes.SELECT
    });

    data.forEach(function (project) {
      const cleanedCost = parseFloat(project.project_cost.replace(/,/g, "")) || 0;
      totalEstimatedCost += cleanedCost;

      if (project.effort !== undefined && !isNaN(project.effort)) {
        totalEffortPH += parseFloat(project.effort);
      }

      switch (project.phase_name.toLowerCase()) {
      case "pitch":
        pitchTotalCost += cleanedCost;
        pitchCount++;
        break;
      case "priority":
        priorityTotalCost += cleanedCost;
        priorityCount++;
        priorityTotalPH += parseFloat(project.effort) || 0;
        console.log("priorityTotalPH: ", priorityTotalPH);
        break;
      case "discovery":
        discoveryTotalCost += cleanedCost;
        discoveryCount++;
        discoveryTotalPH += parseFloat(project.effort) || 0;
        break;
      case "delivery":
        deliveryTotalCost += cleanedCost;
        deliveryCount++;
        deliveryTotalPH += parseFloat(project.effort) || 0;
        break;
      case "operations":
        operationsTotalCost += cleanedCost;
        operationsCount++;
        operationsTotalCost += parseFloat(project.effort) || 0;
        break;
      }
    });

    const formatValue = (value) => {
      if (value >= 1e6) {
        return Math.floor(value / 1e6) + "M";
      } else if (value >= 1e3) {
        return Math.floor(value / 1e3) + "K";
      }
      return value.toString();
    };

    try {
      const pitchTotalSum = formatValue(pitchTotalCost);
      const priorityTotalSum = formatValue(priorityTotalCost);
      priorityTotalPH = formatValue(priorityTotalPH);
      const discoveryTotalSum = formatValue(discoveryTotalCost);
      discoveryTotalPH = formatValue(discoveryTotalPH);
      const deliveryTotalSum = formatValue(deliveryTotalCost);
      deliveryTotalPH = formatValue(deliveryTotalPH);
      const operationsTotalSum = formatValue(operationsTotalCost);
      operationsTotalPH = formatValue(operationsTotalPH);
      let totalCostSum = formatValue(totalEstimatedCost);
      console.log("totalEstimatedCost", totalEstimatedCost);
      console.log("totalCostSum", totalCostSum);
      const totalAvailSum = formatValue(totalEstimatedCost - operationsTotalCost);
      totalCostSum = formatValue(totalCostSum);
      ///////////available $ left subtract funnel and operations from total cost



      console.log({
        pitchTotalSum,
        priorityTotalSum,
        priorityTotalPH,
        discoveryTotalSum,
        deliveryTotalSum,
        operationsTotalSum,
        totalCostSum,
        totalAvailSum,
        deliveryTotalPH,
        deliveryTotalPH,
        discoveryTotalPH,
        operationsTotalPH,
        totalEstimatedCost,
        totalCostSum

      });

      // Render the page with formatted values
      res.render("Dashboard/dashboard1", {
        projects: data,
        pitchCount,
        pitchTotalCost: pitchTotalSum,
        priorityCount,
        priorityTotalCost: priorityTotalSum,
        discoveryCount,
        discoveryTotalCost: discoveryTotalSum,
        deliveryCount,
        deliveryTotalCost: deliveryTotalSum,
        operationsCount,
        operationsTotalCost: operationsTotalSum,
        totalCostSum,
        totalCostUsed: operationsTotalSum,
        totalAvailableCost: totalAvailSum,
        priorityTotalPH,
        discoveryTotalPH,
        totalEstimatedCost

      });
    } catch (err) {
      console.error("Error: ", err);
      res.status(500).send({
        message: "An error occurred while rendering the dashboard."
      });
    }
  } catch (err) {
    console.error("Database Query Error: ", err);
    res.status(500).send({
      message: "An error occurred while retrieving project data."
    });
  }
});

module.exports = router;