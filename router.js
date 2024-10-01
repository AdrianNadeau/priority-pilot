var express = require("express");
var router = express.Router();

const db = require("./models");
const Project = db.projects;
const Op = db.Sequelize.Op;

// Dashboard rout


// const formatValue = require('../utils/formatValue'); // Adjust the path as necessary

router.get("/", async function (req, res) {
  console.log("LOAD DASHBOARD");
  let company_id_fk;
  let pitchCount = 0, pitchTotalCost = 0;
  let priorityCount = 0, priorityTotalCost = 0, priorityTotalPH = 0;
  let discoveryCount = 0, discoveryTotalCost = 0, discoveryTotalPH = 0;
  let deliveryCount = 0, deliveryTotalCost = 0, deliveryTotalPH = 0;
  let operationsCount = 0, operationsTotalCost = 0, operationsTotalPH = 0;
  let totalEstimatedCost = 0, totalUsedCost = 0;
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

  
  
  router.get("/", async function (req, res) {
    console.log("LOAD DASHBOARD - LETS GO");
    // let company_id_fk;
    // let pitchCount = 0, pitchTotalCost = 0;
    // let priorityCount = 0, priorityTotalCost = 0, priorityTotalPH = 0;
    // let discoveryCount = 0, discoveryTotalCost = 0, discoveryTotalPH = 0;
    // let deliveryCount = 0, deliveryTotalCost = 0, deliveryTotalPH = 0;
    // let operationsCount = 0, operationsTotalCost = 0, operationsTotalPH = 0;
    // let totalEstimatedCost = 0, totalUsedCost = 0;
    // let totalEffortPH = 0;
    
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
    console.log("BEFORE QUERY")
    // Custom SQL query
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
    SUM(CAST(proj.project_cost AS NUMERIC)) AS total_project_cost, 
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
    phases.phase_name 
ORDER BY 
    proj.phase_id_fk;
;
`;
  console.log("QUERY:",query)
    try {
      // Execute the SQL query
      const data = await db.sequelize.query(query, {
        replacements: [company_id_fk],
        type: db.sequelize.QueryTypes.SELECT
      });
      console.log("data:",data)
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
            operationsTotalPH += parseFloat(project.effort) || 0;
            break;
        }
      });
  
      // Log individual phase costs
      console.log("pitchTotalCost:", pitchTotalCost);
      console.log("priorityTotalCost:", priorityTotalCost);
      console.log("discoveryTotalCost:", discoveryTotalCost);
      console.log("deliveryTotalCost:", deliveryTotalCost);
      console.log("operationsTotalCost:", operationsTotalCost);
  
      // Calculate total estimated cost from all phases
      totalEstimatedCost = pitchTotalCost + priorityTotalCost + discoveryTotalCost + deliveryTotalCost + operationsTotalCost;
      console.log("TOTAL: ", totalEstimatedCost);
  
      // Calculate total used cost from Priority, Discovery, and Delivery
      totalUsedCost = priorityTotalCost + discoveryTotalCost + deliveryTotalCost;
      console.log("totalUsedCost:", totalUsedCost);
  
      // Calculate total left
      let totalLeftCost = totalEstimatedCost - totalUsedCost;
      console.log("totalLeftCost:", totalLeftCost);
  
      try {
        const pitchTotalSum = formatValue(pitchTotalCost, "number");
        const priorityTotalSum = formatValue(priorityTotalCost, "number");
        priorityTotalPH = formatValue(priorityTotalPH);
        const discoveryTotalSum = formatValue(discoveryTotalCost, "number");
        discoveryTotalPH = formatValue(discoveryTotalPH);
        const deliveryTotalSum = formatValue(deliveryTotalCost, "number");
        deliveryTotalPH = formatValue(deliveryTotalPH);
        const operationsTotalSum = formatValue(operationsTotalCost, "number");
        operationsTotalPH = formatValue(operationsTotalPH);
        const totalCostSum = formatValue(totalEstimatedCost, "number");
        const totalCost = formatValue(totalEstimatedCost - operationsTotalCost - pitchTotalCost, "number");
        totalLeftCost = formatValue(totalLeftCost, "number");
  
        console.log({
          pitchTotalCost,
          pitchTotalSum,
          priorityTotalSum,
          priorityTotalPH,
          discoveryTotalSum,
          deliveryTotalSum,
          operationsTotalSum,
          deliveryTotalPH,
          discoveryTotalPH,
          operationsTotalPH,
          totalEstimatedCost,
          totalCostSum,
          totalUsedCost,
          totalLeftCost
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
          totalCostUsed: formatValue(totalUsedCost, "number"),
          totalCostLeft: totalLeftCost,
          priorityTotalPH,
          discoveryTotalPH,
          totalEstimatedCost,
          deliveryTotalPH,
          totalCost
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
});

const formatValue = (value) => {
  
    if (value >= 1e6) {
      return (value / 1e6).toFixed(1) + "M";
    } else if (value >= 1e3) {
      return (value / 1e3).toFixed(1) + "K";
    }
    return value.toString();
  

  


};


module.exports = router;