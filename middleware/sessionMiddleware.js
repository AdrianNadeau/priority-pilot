async function sessionMiddleware(req, res, next) {
  console.log("SESSSION MIDDLEWARE");

  try {
    if (!req.session) {
      // direct to session timeout page
      res.redirect("/session-expired");
    }
    console.log("req.session:", req.session);
    const company_id_fk = req.session.company.id;
    console.log("company_id_fk:", company_id_fk);
    const person_id_fk = req.session.person.id;
    console.log("person_id_fk:", person_id_fk);

    next();
  } catch (error) {
    console.error("Session Middleware error:", error);
    res.redirect("/session-expired");
  }
}
module.exports = sessionMiddleware;
