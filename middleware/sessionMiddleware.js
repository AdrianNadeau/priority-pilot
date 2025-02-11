async function sessionMiddleware(req, res, next) {
  try {
    if (!req.session) {
      // Direct to session timeout page
      console.log("NOOOOO SESSSSSION");
      res.render("Pages/pages-session-expired");
      return;
    } else {
      // console.log("req.session:", req.session);
      console.log("req.session:", req.session);
      const company_id_fk = req.session.company.id;
      console.log("company_id_fk:", company_id_fk);
      const person_id_fk = req.session.person.id;
      console.log("person_id_fk:", person_id_fk);
    }
    next();
  } catch (error) {
    console.log("ERRRRORRRRR");
    res.redirect("session-expired");
  }
}

module.exports = sessionMiddleware;
