# Global Filter System Documentation

## Overview

The Global Filter System provides centralized date filtering across all pages in the Priority Pilot application. Instead of having separate filter implementations on each page, all filtering is now controlled from the Dashboard page and automatically applied to all relevant pages.

## Key Features

1. **Centralized Control**: All date filtering is controlled from the Dashboard page
2. **Session Storage**: Filter values are stored in the user session and person model
3. **Automatic Application**: Filters are automatically applied to all relevant pages and API endpoints
4. **No Page-Specific Filters**: Individual pages no longer have their own filter controls
5. **Seamless Navigation**: Filter values persist when navigating between pages

## Architecture

### Components

1. **Global Filter Middleware** (`middleware/globalFilterMiddleware.js`)

   - Applies dashboard filter values to all requests
   - Provides utility functions for building filter conditions
   - Makes filter values available to templates

2. **Filter Helper Utilities** (`utils/filterHelper.js`)

   - Helper functions for controllers to apply filters easily
   - Supports both Sequelize and raw SQL queries
   - Provides consistent filter application across controllers

3. **Session Management** (in main router and dashboard)

   - Stores filter values in user session
   - Updates person model with filtered_start and filtered_end
   - Persists filter state across browser sessions

4. **Client-Side Integration** (`public/assets/js/globalFilters.js`)
   - Manages filter state in browser session storage
   - Provides JavaScript functions for accessing current filter values
   - Handles filter initialization on page load

### Database Schema

The `persons` table has been updated with two new columns:

- `filtered_start`: DATE - Stores the user's current start date filter
- `filtered_end`: DATE - Stores the user's current end date filter

## Usage

### For Controllers

Controllers can now use the filter helper utilities instead of manual date filtering:

```javascript
const {
  applyProjectDateFilter,
  getCurrentFilterValues,
} = require("../utils/filterHelper");

// For Sequelize queries
exports.someFunction = async (req, res) => {
  const baseWhere = { company_id_fk: req.session.company.id };
  const whereConditions = applyProjectDateFilter(req, baseWhere);

  const projects = await Project.findAll({
    where: whereConditions,
  });

  res.render("some-page", {
    projects,
    ...getCurrentFilterValues(req), // Passes currentFromDate and currentToDate
  });
};

// For raw SQL queries
exports.anotherFunction = async (req, res) => {
  const baseParams = [req.session.company.id];
  const { whereClause, parameters } = applyRawSQLDateFilter(req, baseParams);

  const query = `SELECT * FROM projects WHERE company_id_fk = ? ${whereClause}`;
  const results = await db.sequelize.query(query, {
    replacements: parameters,
    type: db.sequelize.QueryTypes.SELECT,
  });
};
```

### For Routes

Add the global filter middleware to routes that need filtering:

```javascript
const { applyGlobalFilter } = require("../middleware/globalFilterMiddleware");

router.get(
  "/some-route",
  sessionMiddleware,
  applyGlobalFilter,
  controller.someFunction,
);
```

### For Templates

Templates automatically receive current filter values:

- `currentFromDate` - Current start date filter value
- `currentToDate` - Current end date filter value

### For Client-Side JavaScript

Use the global functions to access current filter values:

```javascript
// Get current filter values
const filters = getGlobalFilterValues();
console.log(filters.fromDate, filters.toDate);

// Navigate to a page while preserving current filters
navigateWithFilters("/projects/radar/view/");

// Listen for filter changes
document.addEventListener("globalFiltersChanged", function (event) {
  const filters = event.detail;
  // Update page content based on new filters
});
```

## Implementation Steps Completed

1. ✅ **Updated Dashboard Route**: Modified the main dashboard route to store filter values in session and person model
2. ✅ **Created Global Filter Middleware**: New middleware that applies filter values to all requests
3. ✅ **Created Filter Helper Utilities**: Utility functions for easy filter application in controllers
4. ✅ **Updated Project Controller**: Added filter helper imports and updated radar function as example
5. ✅ **Updated Project Routes**: Added global filter middleware to relevant routes
6. ✅ **Enhanced Dashboard JavaScript**: Updated client-side filtering to work with global system
7. ✅ **Created Client-Side Support**: JavaScript utilities for accessing and managing filter state
8. ✅ **Updated Person Model**: Model already had filtered_start and filtered_end columns

## Next Steps for Full Implementation

1. **Update Remaining Controllers**: Apply the filter helper pattern to all other controller functions that currently use manual date filtering
2. **Remove Page-Specific Filters**: Remove any remaining filter controls from individual pages
3. **Add Global Filter Middleware**: Add the middleware to all routes that need filtering
4. **Update Templates**: Remove filter UI elements from non-dashboard pages
5. **Include Global Filter Script**: Add the globalFilters.js script to the main layout template
6. **Test Integration**: Verify that filters work correctly across all pages

## Benefits

- **Consistency**: All pages use the same filter values
- **User Experience**: No need to set filters on each page separately
- **Maintainability**: Single point of control for all filtering logic
- **Performance**: Filters are applied efficiently at the middleware level
- **Persistence**: Filter values persist across browser sessions and page navigation

## Migration Path

To migrate existing controllers:

1. Add filter helper import: `const { applyProjectDateFilter, getCurrentFilterValues } = require("../utils/filterHelper");`
2. Replace manual date filtering with helper functions
3. Update render calls to use `...getCurrentFilterValues(req)`
4. Add global filter middleware to relevant routes
5. Remove page-specific filter UI elements
6. Test functionality

This system provides a robust, maintainable foundation for filtering across the entire application while improving user experience and code consistency.
