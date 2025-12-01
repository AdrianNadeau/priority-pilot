const express = require("express");
const router = express.Router();

// Import any necessary models or middleware here

// @route   POST /filter/clear
// @desc    Clear filter session and DB values
router.post("/clear", (req, res) => {
  // Logic to clear filter session and DB values

  res.status(200).json({ message: "Filter cleared" });
});

// Export the router
module.exports = router;

// In your main server file (e.g., app.js or server.js), you would use this route as follows:
// const filterRoutes = require('./routes/filter.routes');
// app.use('/filter', filterRoutes);
