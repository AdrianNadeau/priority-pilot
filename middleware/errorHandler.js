// Middleware to handle errors globally
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || "Internal Server Error";

  // Log the error for debugging
  console.error("Error in error handler:", err);

  res.render("Pages/pages-error", {
    pageTitle: "Error",
    layout: "layout-public",
    person: req.session ? req.session.person : null,
    errorMessage,
    statusCode,
  });
};

module.exports = errorHandler;
