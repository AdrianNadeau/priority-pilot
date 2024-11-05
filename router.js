var express = require('express');
var router = express.Router();

const db = require("./models");
const Project = db.projects;
const Op = db.Sequelize.Op;

// Dashboard
router.get('/', async function (req, res) {
    console.log("--------------------------------- Dashboard page requested ---------------------------------");
  let company_id_fk;

  try {
      company_id_fk = req.session.company.id;
  } catch (error) {
      console.log("SESSION INVALID");
    return res.redirect('/login');
  }
  try {
    // Fetch some data based on the company_id_fk
    const projects = await Project.findAll({ where: { company_id_fk } });
  } catch (error) {
    console.error('Database Query Error: ', error);
    res.status(500).send('Internal Server Error');
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

  //calcuate tax varialbestotalPH
  let totalPitchCount = 0, totalPitchCost = 0, totalPitchPH = 0;
  let totalPriorityCount = 0, totalPriorityCost = 0, totalPriorityPH = 0;
  let totalDiscoveryCount = 0, totalDiscoveryCost = 0, totalDiscoveryPH = 0; 
  let totalDeliveryCount = 0, totalDeliveryCost = 0, totalDeliveryPH = 0; 
  let totalOperactionsCount = 0, totalOperationsCost = 0, totalOperationsPH = 0;
  let totalCost = 0, usedCost = 0, availableCost = 0, totalPH = 0, totalUsedPH = 0, totalAvailPH = 0
 


  try {
      const data = await db.sequelize.query(query, {
          replacements: [company_id_fk],
          type: db.sequelize.QueryTypes.SELECT
      });
    
    // Calculate totalCostLeft (Total cost - Operations cost)
    data.forEach(function (project) {
        try {
            // Convert project cost and effort
            
            let projectCost = parseFloat(project.project_cost.toString().replace(/,/g, '')) || 0;
            let projectEffortPH = parseInt(project.effort) || 0;
            totalCost += projectCost;
            totalPH+=projectEffortPH;

            // Categorize based on phase name
            switch (project.phase_name.toLowerCase()) {
                case "pitch":
                    totalPitchCount++;
                    totalPitchCost += projectCost;
                    totalPitchPH += projectEffortPH;
                    totalPH += totalPitchPH;
                    
                    break;
                case "priority":
                    totalPriorityCount++;
                    totalPriorityCost += projectCost;
                    totalPriorityPH += projectEffortPH;
                    totalPH += totalPriorityPH;
                    break;
                case "discovery":
                    
                    totalDiscoveryCount++;
                    totalDiscoveryCost += projectCost;
                    totalDiscoveryPH += projectEffortPH;
                    totalPH += totalDiscoveryPH;
                    
                    break;
                case "delivery":
                    totalDeliveryCount++;
                    totalDeliveryCost += projectCost;
                    totalDeliveryPH += projectEffortPH;
                    totalPH += totalDeliveryPH;
                    totalUsedPH += projectEffortPH;
                    break;
                case "done":
                    totalOperactionsCount++;
                    totalOperationsCost += projectCost;
                    totalOperationsPH += projectEffortPH;
                    totalPH += totalOperationsPH;
                    totalUsedPH += projectEffortPH;
                    break;
                default:
                    console.log("Unknown phase: " + project.phase_name);
            }
        } catch (error) {
            console.log("Error processing project:", error);
        }
        
    });
    
    totalCost=totalPitchCost +totalPriorityCost + totalDiscoveryCost + totalDeliveryCost + totalOperationsCost;
    console.log("totalCost",totalCost)
    usedCost=totalCost-totalOperationsCost;
    console.log("usedCost",usedCost)
    availableCost=totalCost-usedCost;
    console.log("availableCost",availableCost);
    totalPH=totalPitchPH + totalPriorityPH + totalDiscoveryPH + totalDeliveryPH + totalOperationsPH;
    totalUsedPH = totalPH - totalOperationsPH;
    totalAvailPH = totalPH-totalUsedPH;
    
    
   
    // Calculate totalCostLeft (Total cost - Operations cost)
    totalCost=formatCost(totalCost);
    console.log("formatted totalCost:",totalCost)
    usedCost=formatCost(usedCost),
    console.log("formatted usedCost:",usedCost)
    
    
    availableCost=formatCost(availableCost),
    console.log("avail:",availableCost),
    // usedCost=formatCost(totalOperationsCost),
    totalOperationsCost=formatCost(totalOperationsCost),

    
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
        totalCost,
        priorityTotalPH: formatValue(totalPriorityPH),
        deliveryTotalPH: formatValue(totalDeliveryPH),
        discoveryTotalPH: formatValue(totalDiscoveryPH),
        operationsTotalPH: formatValue(totalOperationsPH),
        totalPH: totalPH,
        totalUsedPH: totalUsedPH,
        totalAvailPH: totalAvailPH,
        totalDeliveryCount,
        totalDiscoveryCount,
        totalOperationsCost,
        usedCost,
        availableCost: availableCost,
        totalPitchPH: formatValue(totalPitchPH),
        
       
        
    });


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
    
    
const formatCost = (cost) => {
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
