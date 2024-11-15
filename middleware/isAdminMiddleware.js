const db = require("../models");
const Project = db.projects;
const Phase = db.phases;
const Priority = db.priorities;
const Person = db.persons;
const currentDate = new Date();

async function isAdminMiddleware(req, res, next) {
  try {
    // Check if user is in the session and if they are an admin
    if (!req.session || !req.session.person || !req.session.company) {
      // Redirect or send an error response if user or company is missing in session
      return res.redirect("/login");
    }
    const person = req.session.person;
    if (person.isAdmin) {
      // If user is admin, proceed to the next middleware or route handler
      return next();
    }
    // If user is not an admin, fetch and filter projects
    const userId = person.id;
    const companyId = req.session.company.id;

    // Retrieve projects where the user is either the sponsor or prime
    const query = `
      SELECT proj.company_id_fk, proj.id, proj.project_name, proj.prime_id_fk, proj.start_date, proj.end_date, 
        prime_person.first_name AS prime_first_name, prime_person.last_name AS prime_last_name, 
        sponsor_person.first_name AS sponsor_first_name, sponsor_person.last_name AS sponsor_last_name, 
        proj.project_cost, phases.phase_name 
      FROM projects proj
      LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk
      LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk
      LEFT JOIN phases ON phases.id = proj.phase_id_fk
      WHERE proj.company_id_fk = ? AND (proj.sponsor_id_fk = ? OR proj.prime_id_fk = ?)
    `;

    // Execute the query to get the filtered projects
    const projectsData = await db.sequelize.query(query, {
      replacements: [companyId, userId, userId],
      type: db.sequelize.QueryTypes.SELECT,
    });

    // Retrieve other necessary data for rendering the page
    const [phasesData, prioritiesData, personsData] = await Promise.all([
      Phase.findAll(),
      Priority.findAll(),
      Person.findAll({ where: { company_id_fk: companyId } }),
    ]);

    // Render the "Pages/pages-projects" view with filtered data
    res.render("Pages/pages-prime-only", {
      projects: projectsData,
      phases: phasesData,
      priorities: prioritiesData,
      sponsors: personsData,
      primes: personsData,
      current_date: currentDate,
    });
  } catch (error) {
    console.error("Error in isAdminMiddleware:", error);
    res.status(500).send("Error checking admin status.");
  }
}

module.exports = isAdminMiddleware;
