var express = require('express');
var router = express.Router();

const db = require("./models");
const Project = db.projects;
const Op = db.Sequelize.Op;

// Dashboard
router.get('/', async function (req, res) {
  let company_id_fk;

  try {
      company_id_fk = req.session.company.id;
  } catch (error) {
      console.log("SESSION INVALID");
      return res.redirect('/login');
  }

  // Custom SQL query
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

  // Initialize counters and totals for each phase
  let phaseData = {
      pitch: { count: 0, totalCost: 0, totalPH: 0 },
      priority: { count: 0, totalCost: 0, totalPH: 0 },
      discovery: { count: 0, totalCost: 0, totalPH: 0 },
      delivery: { count: 0, totalCost: 0, totalPH: 0 },
      operations: { count: 0, totalCost: 0, totalPH: 0 },
  };


  //calcuate tax varialbes
  let totalPitchCount = 0, totalPitchCost = 0, totalPitchPH = 0;
  let totalPriorityCount = 0, totalPriorityCost = 0, totalPriorityPH = 0;
  let totalDiscoveryCount = 0, totalDiscoveryCost = 0, totalDiscoveryPH = 0; 
  let totalDeliveryCount = 0, totalDeliveryCost = 0, totalDeliveryPH = 0; 
  let totalOperactionsCount = 0, totalOperationsCost = 0, totalOperationsPH = 0;
  let totalCost = 0, totalPH, totalUsedPH, totalLeftPH  = 0;    
 
  let totalCostLeft = 0;

  try {
      const data = await db.sequelize.query(query, {
          replacements: [company_id_fk],
          type: db.sequelize.QueryTypes.SELECT
      });
    //   data.forEach(function (project) {
    //     try {
    //         // Convert project cost and effort
    //         console.log("project.project_cost:", project.project_cost);
    //         let projectCost = parseFloat(project.project_cost.toString().replace(/,/g, '')) || 0;
    //         console.log("projectCost:", projectCost);
    //         let projectEffortPH = parseInt(project.effort) || 0;
    //         totalCost += projectCost;

    //         // Categorize based on phase name
    //         switch (project.phase_name.toLowerCase()) {
    //             case "pitch":
    //                 totalPitchCount++;
    //                 totalPitchCost += projectCost;
    //                 totalCost += projectCost;
    //                 totalPitchPH += projectEffortPH;
    //                 totalPH += projectEffortPH;
    //                 break;
    //             // Add other cases here...
    //         }
    //     } catch (error) {
    //         console.log("Error processing project:", error);
    //     }
    // });
    // console.log("totalPitchCount:", totalPitchCount);
    // console.log("totalPriorityCost:", totalPriorityCost);
    // console.log("totalDiscoveryCost:", totalDiscoveryCost);
    // console.log("totalCost:", totalCost);
    // console.log("totalOperationsCost:", totalOperationsCost);

    // Calculate totalCostLeft (Total cost - Operations cost)
    totalLeftPH = totalCost - totalOperationsCost;

    // Format numbers for display
    function formatCost(value) {
        console.log("Formatting value:", value); // Add logging
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        } else {
            return value.toFixed(1);
        }
    }

    data.forEach(function (project) {
        try {
            // Convert project cost and effort
            console.log("project.project_cost:", project.project_cost);
            let projectCost = parseFloat(project.project_cost.toString().replace(/,/g, '')) || 0;
            console.log("projectCost:", projectCost);
            let projectEffortPH = parseInt(project.effort) || 0;
            totalCost += projectCost;
    
            // Categorize based on phase name
            switch (project.phase_name.toLowerCase()) {
                case "pitch":
                    totalPitchCount++;
                    totalPitchCost += projectCost;
                    totalPitchPH += projectEffortPH;
                    totalPH += projectEffortPH;
                    break;
                case "priority":
                    totalPriorityCount++;
                    totalPriorityCost += projectCost;
                    totalPriorityPH += projectEffortPH;
                    totalPH += projectEffortPH;
                    break;
                case "discovery":
                    totalDiscoveryCount++;
                    totalDiscoveryCost += projectCost;
                    totalDiscoveryPH += projectEffortPH;
                    totalPH += projectEffortPH;
                    totalUsedPH += projectEffortPH;
                    break;
                case "delivery":
                    totalDeliveryCount++;
                    totalDeliveryCost += projectCost;
                    totalDeliveryPH += projectEffortPH;
                    totalPH += projectEffortPH;
                    totalUsedPH += projectEffortPH;
                    break;
                case "operations":
                    totalOperactionsCount++;
                    totalOperationsCost += projectCost;
                    totalOperationsPH += projectEffortPH;
                    totalPH += projectEffortPH;
                    totalUsedPH += projectEffortPH;
                    break;
                default:
                    console.log("Unknown phase: " + project.phase_name);
            }
        } catch (error) {
            console.log("Error processing project:", error);
        }
    });
    console.log("totalPitchCount:", totalPitchCount);
    console.log("totalPriorityCost:", totalPriorityCost);
    console.log("totalDiscoveryCost:", totalDiscoveryCost);
    
    // Calculate totalCostLeft (Total cost - Operations cost)
    totalLeftPH = totalCost - totalOperationsCost;
    
    // Render the page with the data
    res.render('Dashboard/dashboard1', {
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
        totalOperactionsCount: formatValue(totalOperactionsCount),
        totalCost: formatCost(totalCost),
        totalCostLeft: formatCost(totalLeftPH),
        totalCostUsed: formatCost(totalOperationsCost),
        priorityTotalPH: formatValue(totalPriorityPH),
        deliveryTotalPH: formatValue(totalDeliveryPH),
        discoveryTotalPH: formatValue(totalDiscoveryPH),
        operationsTotalPH: formatValue(totalOperationsPH),
        totalPH: formatValue(totalPH),
        totalUsedPH: formatValue(totalUsedPH),
        totalLeftPH,
        totalDeliveryCount,
        totalDiscoveryCount,
        totalOperationsCost
    });
    
    // Helper function to format cost values
    
function formatCost(value) {
    console.log("FORMAT COST:", value); // Add logging
    if (value >= 1000000000) {
        return (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        console.log("add a K")
        return (value / 1000).toFixed(1) + 'K';
    } else {
        return value.toFixed(1);
    }
}
    
    // Helper function to format values with commas
    function formatValue(value) {
        if (value === undefined || value === null) {
            return '0';
        }
        return value.toLocaleString('en-US');
    }
  } catch (err) {
      console.error("Error while fetching data:", err);
      res.status(500).send("Internal Server Error");
  }
});
// Helper function to format cost values

module.exports = router;
