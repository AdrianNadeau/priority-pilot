const session = require("express-session");
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/JWTRouter");

const { persons: Person, companies: Company } = db;

// Helper function to authenticate user credentials
const authenticateUser = async (email, password) => {
  try {
    const person = await Person.findOne({ where: { email } });
    if (!person) return null;

    const isMatch = await bcrypt.compare(
      password.trim(),
      person.password.trim(),
    );
    return isMatch ? person : null;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
};

// Register and create a new user
exports.create = async (req, res) => {
  try {
    const {
      email,
      first_name,
      last_name,
      initials,
      password,
      register_yn,
      isAdmin,
    } = req.body;
    const company_id_fk = req.session.company?.id;

    // Ensure company exists for this session
    const company = await Company.findByPk(company_id_fk);
    if (!company)
      return res.status(404).json({ message: "Company not found." });

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });

    const existingPerson = await Person.findOne({ where: { email } });
    if (existingPerson)
      return res
        .status(409)
        .json({ message: "User with this email already exists." });

    // Determine admin status
    const isAdminStatus = isAdmin === "true" || register_yn === "y";
    console.log("isAdminStatus:", isAdminStatus);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new person
    const newPerson = await Person.create({
      email,
      first_name,
      last_name,
      initials,
      password: hashedPassword,
      company_id_fk,
      isAdmin: isAdminStatus,
    });

    if (!req.session.person) {
      // Update session
      req.session.company = company;
      req.session.person = newPerson;
    }
    console.log("Redirecting to Dashboard...");

    res.redirect(register_yn === "y" ? "/" : "/persons");
  } catch (error) {
    console.error("!!!Error creating person:", error);
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
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const person = await authenticateUser(email, password);
    if (!person)
      return res.status(401).json({ message: "Invalid username or password." });

    const company = await Company.findByPk(person.company_id_fk);
    if (!company) return res.redirect("/login");

    req.session.regenerate((err) => {
      if (err) {
        console.error("Error regenerating session:", err);
        return res.status(500).send("Internal Server Error");
      }

      req.session.company = company;
      req.session.person = person;
      console.log("Redirecting to Dashboard...");
      res.redirect("/");
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send({
      message: err.message || "Some error occurred while logging in.",
    });
  }
};

// Find a single person by id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Person.findByPk(id);
    if (data) {
      res.redirect(`/persons/edit/${id}`);
    } else {
      res.status(404).send({ message: `Cannot find Person with id=${id}.` });
    }
  } catch (error) {
    console.error("Error retrieving Person:", error);
    res.status(500).send({ message: "Error retrieving Person with id=" + id });
  }
};

// Get single user for editing
exports.findOneForEdit = async (req, res) => {
  try {
    const personData = await Person.findByPk(req.params.id);
    if (personData) {
      res.render("Pages/pages-edit-person", { personData });
    } else {
      res
        .status(404)
        .send({ message: `Cannot find Person with id=${req.params.id}.` });
    }
  } catch (error) {
    console.error("Error retrieving person:", error);
    res
      .status(500)
      .send({ message: `Error retrieving Person with id=${req.params.id}` });
  }
};

// Update user
exports.update = async (req, res) => {
  try {
    const { person_id, isAdmin, ...personDetails } = req.body;
    personDetails.isAdmin = isAdmin === "true";

    const [updated] = await Person.update(personDetails, {
      where: { id: person_id },
    });
    if (updated) {
      res.redirect("/persons/");
    } else {
      res
        .status(404)
        .send({ message: `Cannot update Person with id=${person_id}.` });
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
      res
        .status(404)
        .send({ message: `Cannot delete Person with id=${req.params.id}.` });
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
