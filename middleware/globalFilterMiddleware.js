/**
 * Global Filter Middleware
 * Applies dashboard date filters to all pages that need filtering
 */

const applyGlobalFilter = (req, res, next) => {
  // Get session filter values
  const filteredStart = req.session.filtered_start;
  const filteredEnd = req.session.filtered_end;

  // Pass session values to template for input field population
  res.locals.currentFromDate = filteredStart || "";
  res.locals.currentToDate = filteredEnd || "";

  // For compatibility with existing code
  req.globalFilter = {
    fromDate: filteredStart,
    toDate: filteredEnd,
  };

  next();
}; /**
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
    // Use overlap logic: show projects that overlap with filter period
    whereClause = ` AND ${startDateColumn} <= ? AND ${endDateColumn} >= ?`;
    parameters.push(filter.toDate, filter.fromDate);
  } else if (filter.fromDate) {
    // Show projects that end on or after the from date
    whereClause = ` AND ${endDateColumn} >= ?`;
    parameters.push(filter.fromDate);
  } else if (filter.toDate) {
    // Show projects that start on or before the to date
    whereClause = ` AND ${startDateColumn} <= ?`;
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

  if (filter.fromDate && filter.toDate) {
    // Show projects that overlap with the filter period
    whereConditions[startDateColumn] = { [Op.lte]: filter.toDate };
    whereConditions[endDateColumn] = { [Op.gte]: filter.fromDate };
  } else if (filter.fromDate) {
    whereConditions[endDateColumn] = { [Op.gte]: filter.fromDate };
  } else if (filter.toDate) {
    whereConditions[startDateColumn] = { [Op.lte]: filter.toDate };
  }

  return whereConditions;
};
module.exports = {
  applyGlobalFilter,
  buildDateFilter,
  buildSequelizeFilter,
};
