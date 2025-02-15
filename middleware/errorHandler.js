function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).render("Pages/pages-500", { message: err.message });
}

module.exports = errorHandler;
