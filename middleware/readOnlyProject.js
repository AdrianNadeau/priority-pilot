function readOnlyProject(req, res, next) {
  req.readOnly = true;
  next();
}

module.exports = readOnlyProject;
