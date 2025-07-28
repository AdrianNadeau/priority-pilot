// Middleware to handle errors globally
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || "Internal Server Error";

  res.render("Pages/pages-error", {
    layout: "layout-public",
    person: req.session.person,
    errorMessage,
    statusCode,
  });
};

module.exports = errorHandler;
