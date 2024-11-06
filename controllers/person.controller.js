const session = require("express-session");
const db = require("../models");
var bcrypt = require('bcryptjs');
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/JWTRouter");


const { persons: Person, companies: Company } = db;

// Helper function to authenticate user credentials
const authenticateUser = async (username, password) => {
  try {
    // Find user by email
    const person = await Person.findOne({ where: { email: username } });
    if (!person) {
      return null;
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, person.password);
    if (!isMatch) {
      return null;
    }

    // Authentication successful, return the user object
    return person;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
};
// Register and create a new user
exports.create = async (req, res) => {
  try {
    const { email, first_name, last_name, initials, password } = req.body;
    const company_id_fk = req.session.company?.id;
    const company = await Company.findOne({ where: { id: company_id_fk } });
    if(company){
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }

      const existingPerson = await Person.findOne({ where: { email } });
      if (existingPerson) {
        return res.status(409).json({ message: "User with this email already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newPerson = await Person.create({
        email,
        first_name,
        last_name,
        initials,
        password: hashedPassword,
        company_id_fk
      });

      // res.status(201).json(newPerson);
      //check for admin
      // Set new session values
        req.session.company = company;
        req.session.person = newPerson;
        console.log("Redirecting to Dashboard...");
        res.redirect("/");
    }
  } catch (error) {
    console.error("Error creating person:", error);
    res.status(500).json({ message: "Error creating person." });
  }
};

// Get all users for the company
exports.findAll = async (req, res) => {
  try {
    const company_id_fk = req.session.company?.id;
    if (!company_id_fk) return res.redirect("/pages-500");

    const data = await Person.findAll({ where: { company_id_fk } });
    res.render("Pages/pages-persons", { persons: data });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).send({ message: "Error retrieving users." });
  }
};

// Login user
// Login user
exports.login = async (req, res) => {
  console.log("email", req.body);
  try {
    const { email, password } = req.body;
    console.log("Email:", email);

    // Authenticate the user
    const person = await authenticateUser(email, password);
    if (!person) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    console.log(`Company login ID: ${person.company_id_fk}`);

    // Find the associated company
    const company = await Company.findOne({ where: { id: person.company_id_fk } });
    if (!company) {
      return res.redirect("/login");
    }

    // Check if session values are present
    if (req.session.company || req.session.person) {
      console.log("Destroying existing session...");

      req.session.destroy(async err => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).send('Internal Server Error');
        }

        // Create a new session
        req.session.regenerate(async err => {
          if (err) {
            console.error('Error regenerating session:', err);
            return res.status(500).send('Internal Server Error');
          }

          // Set new session values
          req.session.company = company;
          req.session.person = person;
          console.log("Redirecting to Dashboard...");
          res.redirect("/");
        });
      });
    } else {
      // No existing session; set new session values directly
      req.session.company = company;
      req.session.person = person;
      console.log("Redirecting to Dashboard with new session...");
      res.redirect("/");
    }

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send({
      message: err.message || "Some error occurred while logging in."
    });
  }
};
// Find a single  with an id
exports.findOne = (req, res) => {
  id = req.params.id;
  Person.findByPk(id)
    .then(data => {
      if (data) {
        // res.send(data);
        res.redirect("/persons/edit/"+id);
      } else {
        res.status(404).send({
          message: `Cannot find Person with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Person with id=" + id
      });
    });
};

// Get single user for editing
exports.findOneForEdit = async (req, res) => {
  try {
    const personData = await Person.findByPk(req.params.id);
    if (personData) {
      res.render("Pages/pages-edit-person", { personData });
    } else {
      res.status(404).send({ message: `Cannot find Person with id=${req.params.id}.` });
    }
  } catch (error) {
    console.error("Error retrieving person:", error);
    res.status(500).send({ message: `Error retrieving Person with id=${req.params.id}` });
  }
};

// Update user
exports.update = async (req, res) => {
  try {
    const { person_id, ...personDetails } = req.body;
    const [updated] = await Person.update(personDetails, { where: { id: person_id } });

    if (updated) {
      res.redirect("/persons/");
    } else {
      res.status(404).send({ message: `Cannot update Person with id=${person_id}.` });
    }
  } catch (error) {
    console.error("Error updating person:", error);
    res.status(500).send({ message: "Error updating person." });
  }
};

// Delete a user
exports.delete = async (req, res) => {
  try {
    const deleted = await Person.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.send({ message: "Person was deleted successfully!" });
    } else {
      res.status(404).send({ message: `Cannot delete Person with id=${req.params.id}.` });
    }
  } catch (error) {
    console.error("Error deleting person:", error);
    res.status(500).send({ message: "Could not delete Person." });
  }
};

// Delete all users
exports.deleteAll = async (req, res) => {
  try {
    const deleted = await Person.destroy({ where: {}, truncate: true });
    res.send({ message: `${deleted} users were deleted successfully!` });
  } catch (error) {
    console.error("Error deleting all persons:", error);
    res.status(500).send({ message: "Could not delete persons." });
  }
};
