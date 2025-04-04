const db = require("../models");
const { persons: Person, companies: Company } = db;

async function authMiddleware(req, res, next) {
  try {
    if (req.session.person) {
      const id = req.session.person.id;
      const person = await Person.findByPk(id);

      // If the user exists, update the session's user data
      if (person) {
        req.session.person = person;

        // Update res.locals for global access in templates
        res.locals.person = req.session.person;
      } else {
        // If the user no longer exists, clear the session
        req.session.person = null;
        res.locals.person = null;
      }
    } else {
      res.locals.person = null;
      console.log(
        "No session found for person, could be change password or login page",
      );
    }
  } catch (error) {
    console.error("Error in auth middleware:", error);
    res.locals.person = null;
  }

  next();
}

module.exports = authMiddleware;
