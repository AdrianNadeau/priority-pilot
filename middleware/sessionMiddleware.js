async function sessionMiddleware(req, res, next) {
  try {
    if (!req.session) {
      // Direct to session timeout page
      res.render("Pages/pages-session-expired");
      return;
    } else {
      // console.log("req.session:", req.session);
      const company_id_fk = req.session.company.id;
      const person_id_fk = req.session.person.id;
    }
    next();
  } catch (error) {
    console.log("ERRRRORRRRR");
    res.redirect("/session-expired");
  }
}

module.exports = sessionMiddleware;
