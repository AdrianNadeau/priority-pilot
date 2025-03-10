// Middleware to handle errors globally
const errorHandler = (err, req, res, next) => {
  console.error(`Error: ${err.message}`);

  const statusCode = err.statusCode || 500;

  res.render("Pages/pages-error", {
    person: req.session.person,
    message: err.message || "Internal Server Error",
    statusCode,
  });
};

module.exports = errorHandler;
