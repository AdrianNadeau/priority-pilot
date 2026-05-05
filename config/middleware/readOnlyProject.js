const db = require("../models");

const checkProjectReadonly = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 640); // Get the project ID from the route parameter
    console.log("Project ID:", projectId);
    // Check if the project ID equals 100 (or any other condition)
    if (projectId === 100) {
      // Set a flag to indicate that the project is readonly
      res.locals.isReadOnly = true;
    } else {
      res.locals.isReadOnly = false;
    }

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error checking project readonly status:", error);
    res.status(500).send({ message: "Server error" });
  }
};

module.exports = checkProjectReadonly;
