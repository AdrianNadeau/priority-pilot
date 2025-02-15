async function sessionMiddleware(req, res, next) {
  try {
    if (!req.session || !req.session.company || !req.session.person) {
      // Redirect to session expired page
      res.redirect("/session-expired");
      return;
    } else {
      // console.log("req.session:", req.session);
      const company_id_fk = req.session.company.id;
      const person_id_fk = req.session.person.id;
    }
    next();
  } catch (error) {
    next(error); // Pass the error to the error handler
  }
}

module.exports = sessionMiddleware;
