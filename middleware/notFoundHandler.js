function notFoundHandler(req, res, next) {
  res
    .status(404)
    .render("Pages/pages-404", {
      message: "Page Not Found",
      pageTitle: "404 Not Found",
    });
}

module.exports = notFoundHandler;
