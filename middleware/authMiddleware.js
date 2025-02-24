const db = require("../models");
const { persons: Person, companies: Company } = db;

async function authMiddleware(req, res, next) {
  try {
    if (req.session.person) {
      const id = req.session.person.id;
      const person = await Person.findByPk(id);

      // If the user exists, update the session's user data
      if (person) {
        console.log("Person exists:", person);
        req.session.person = person;

        // Update res.locals for global access in templates
        res.locals.person = req.session.person;
      } else {
        // If the user no longer exists, clear the session
        delete req.session.person.id;
        delete req.session.person;
      }
    }
  } catch (error) {
    console.error("Error in auth middleware:", error);
  }

  next();
}

module.exports = authMiddleware;
