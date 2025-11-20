/**
 * Global Filter Middleware
 * Applies dashboard date filters to all pages that need filtering
 */

const applyGlobalFilter = (req, res, next) => {
  // Get filter values from session (set by dashboard)
  const filteredStart = req.session.filtered_start;
  const filteredEnd = req.session.filtered_end;

  // Make filter values available to all routes
  req.globalFilter = {
    fromDate: filteredStart,
    toDate: filteredEnd,
  };

  // Add to locals so templates can access them (only if values exist)
  res.locals.currentFromDate = filteredStart || null;
  res.locals.currentToDate = filteredEnd || null;

  next();
};

/**
 * Builds date filter SQL conditions for queries
 * @param {Object} filter - Filter object with fromDate and toDate
 * @param {string} startDateColumn - Name of the start date column (default: 'start_date')
 * @param {string} endDateColumn - Name of the end date column (default: 'end_date')
 * @returns {Object} - Object with whereClause string and parameters array
 */
const buildDateFilter = (
  filter,
  startDateColumn = "start_date",
  endDateColumn = "end_date",
) => {
  let whereClause = "";
  let parameters = [];

  if (filter.fromDate && filter.toDate) {
    whereClause = ` AND ${startDateColumn} >= ? AND ${endDateColumn} <= ?`;
    parameters.push(filter.fromDate, filter.toDate);
  } else if (filter.fromDate) {
    whereClause = ` AND ${startDateColumn} >= ?`;
    parameters.push(filter.fromDate);
  } else if (filter.toDate) {
    whereClause = ` AND ${endDateColumn} <= ?`;
    parameters.push(filter.toDate);
  }

  return { whereClause, parameters };
};

/**
 * Builds Sequelize where conditions for date filtering
 * @param {Object} filter - Filter object with fromDate and toDate
 * @param {string} startDateColumn - Name of the start date column (default: 'start_date')
 * @param {string} endDateColumn - Name of the end date column (default: 'end_date')
 * @returns {Object} - Sequelize where conditions object
 */
const buildSequelizeFilter = (
  filter,
  startDateColumn = "start_date",
  endDateColumn = "end_date",
) => {
  const { Op } = require("sequelize");
  const whereConditions = {};

  console.log("buildSequelizeFilter - input filter:", filter);
  console.log("buildSequelizeFilter - fromDate:", filter.fromDate);
  console.log("buildSequelizeFilter - toDate:", filter.toDate);

  if (filter.fromDate && filter.toDate) {
    // Show projects that overlap with the filter period
    whereConditions[startDateColumn] = { [Op.lte]: filter.toDate };
    whereConditions[endDateColumn] = { [Op.gte]: filter.fromDate };
    console.log("buildSequelizeFilter - both dates set, using overlap logic");
  } else if (filter.fromDate) {
    // Show projects that end on or after the from date
    whereConditions[endDateColumn] = { [Op.gte]: filter.fromDate };
    console.log("buildSequelizeFilter - only fromDate set");
  } else if (filter.toDate) {
    // Show projects that start on or before the to date
    whereConditions[startDateColumn] = { [Op.lte]: filter.toDate };
    console.log("buildSequelizeFilter - only toDate set");
  } else {
    console.log("buildSequelizeFilter - no dates set, no filter applied");
  }

  console.log("buildSequelizeFilter - result:", whereConditions);
  return whereConditions;
};

module.exports = {
  applyGlobalFilter,
  buildDateFilter,
  buildSequelizeFilter,
};
