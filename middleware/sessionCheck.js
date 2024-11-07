// middleware/sessionCheck.js
const sessionCheck = (req, res, next) => {
  if (!req.session?.company?.id) {
    return res.redirect("Pages/pages-session-expired");
  }
  req.companyId = req.session.company.id;
  next();
};

module.exports = sessionCheck;
