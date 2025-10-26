/**
 * Global Filter Controller Helper
 * Provides common filtering functionality for all controllers
 */

const db = require("../models");
const {
  buildDateFilter,
  buildSequelizeFilter,
} = require("../middleware/globalFilterMiddleware");

/**
 * Apply global date filter to projects query
 * @param {Object} req - Express request object
 * @param {Object} baseWhere - Base where conditions for the query
 * @returns {Object} - Updated where conditions with date filter
 */
const applyProjectDateFilter = (req, baseWhere = {}) => {
  const filter = req.globalFilter || {};
  const dateFilter = buildSequelizeFilter(filter);

  return {
    ...baseWhere,
    ...dateFilter,
  };
};

/**
 * Apply global date filter to raw SQL queries
 * @param {Object} req - Express request object
 * @param {Array} baseParams - Base parameters for the query
 * @param {string} startColumn - Start date column name (default: 'start_date')
 * @param {string} endColumn - End date column name (default: 'end_date')
 * @returns {Object} - Object with SQL where clause and parameters
 */
const applyRawSQLDateFilter = (
  req,
  baseParams = [],
  startColumn = "start_date",
  endColumn = "end_date",
) => {
  const filter = req.globalFilter || {};
  const { whereClause, parameters } = buildDateFilter(
    filter,
    startColumn,
    endColumn,
  );

  return {
    whereClause,
    parameters: [...baseParams, ...parameters],
  };
};

/**
 * Get current filter values for template rendering
 * @param {Object} req - Express request object
 * @returns {Object} - Object with current filter values
 */
const getCurrentFilterValues = (req) => {
  const filter = req.globalFilter || {};
  return {
    currentFromDate: filter.fromDate || "",
    currentToDate: filter.toDate || "",
  };
};

/**
 * Check if any filters are currently active
 * @param {Object} req - Express request object
 * @returns {boolean} - True if filters are active
 */
const hasActiveFilters = (req) => {
  const filter = req.globalFilter || {};
  return !!(filter.fromDate || filter.toDate);
};

module.exports = {
  applyProjectDateFilter,
  applyRawSQLDateFilter,
  getCurrentFilterValues,
  hasActiveFilters,
};
