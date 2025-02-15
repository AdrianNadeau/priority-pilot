function notFoundHandler(req, res, next) {
  res.status(404).render("Pages/pages-404", { message: "Page Not Found" });
}

module.exports = notFoundHandler;
