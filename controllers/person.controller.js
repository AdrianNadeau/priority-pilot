const session = require("express-session");
const path = require("path");
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/JWTRouter");
const sendEmail = require("../utils/emailSender");
const sgMail = require("@sendgrid/mail");
const ejs = require("ejs");
const { v4: uuidv4 } = require("uuid");
const e = require("express");
const Person = db.persons;
const Company = db.companies;
const ChangedPasswordToken = db.changed_password_token;

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
    throw error;
  }
};

// Register and create a new user
exports.create = async (req, res, next) => {
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

    const company = await Company.findByPk(company_id_fk);
    if (!company) throw new Error("Company not found.");

    if (!email || !password) {
      const error = new Error("Email and password are required.");
      error.statusCode = 400;
      throw error;
    }

    const existingPerson = await Person.findOne({ where: { email } });
    if (existingPerson) {
      const error = new Error("User with this email already exists.");
      error.statusCode = 409;
      throw error;
    }

    const isAdminStatus = isAdmin === "true" || register_yn === "y";
    const hashedPassword = await bcrypt.hash(password, 10);

    await Person.create({
      email,
      first_name,
      last_name,
      initials,
      password: hashedPassword,
      company_id_fk,
      isAdmin: isAdminStatus,
    });

    res.redirect(register_yn === "y" ? "/" : "/persons");
  } catch (error) {
    next(error);
  }
};

// Get all users for the company
exports.findAll = async (req, res, next) => {
  try {
    const company_id_fk = req.session.company?.id;
    const data = await Person.findAll({
      where: { company_id_fk },
      order: [
        ["last_name", "ASC"],
        ["first_name", "ASC"],
      ],
    });
    res.render("Pages/pages-persons", { persons: data });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const person = await authenticateUser(email, password);
    if (!person) {
      const error = new Error("Invalid username or password.");
      error.statusCode = 401;
      throw error;
    }

    const company = await Company.findByPk(person.company_id_fk);
    if (!company) return res.redirect("/login");

    req.session.company = company;
    req.session.person = {
      id: person.id,
      firstName: person.first_name,
      lastName: person.last_name,
      email: person.email,
      company_id_fk: person.company_id_fk,
      isAdmin: person.isAdmin,
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Internal Server Error");
      }
      res.redirect("/");
    });
  } catch (error) {
    next(error);
  }
};

// Find a single person by id
exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await Person.findByPk(id);
    if (!data) {
      const error = new Error(`Person with id=${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    res.redirect(`/persons/edit/${id}`);
  } catch (error) {
    next(error);
  }
};

// Get single user for editing
exports.findOneForEdit = async (req, res, next) => {
  try {
    const personData = await Person.findByPk(req.params.id);
    if (!personData) {
      const error = new Error(`Person with id=${req.params.id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    res.render("Pages/pages-edit-person", { personData });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.update = async (req, res, next) => {
  try {
    const { person_id, isAdmin, ...personDetails } = req.body;
    personDetails.isAdmin = isAdmin === "true";

    const [updated] = await Person.update(personDetails, {
      where: { id: person_id },
    });
    if (!updated) {
      const error = new Error(`Cannot update Person with id=${person_id}.`);
      error.statusCode = 404;
      throw error;
    }
    res.redirect("/persons/");
  } catch (error) {
    next(error);
  }
};

// Delete a user
exports.delete = async (req, res, next) => {
  try {
    const deleted = await Person.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      const error = new Error(`Cannot delete Person with id=${req.params.id}.`);
      error.statusCode = 404;
      throw error;
    }
    res.json({ message: "Person was deleted successfully!" });
  } catch (error) {
    next(error);
  }
};

// Delete all users
exports.deleteAll = async (req, res, next) => {
  try {
    const deleted = await Person.destroy({ where: {}, truncate: true });
    res.json({ message: `${deleted} users were deleted successfully!` });
  } catch (error) {
    next(error);
  }
};

// Send Welcome Email
exports.sendWelcomeEmail = async (req, res) => {
  const personFirstName = req.session.person?.firstName;
  const personEmail = req.session.person?.email;

  try {
    await sendEmail(personEmail, "Welcome to Priority Pilot!", "welcome", {
      first_name: personFirstName,
    });
    res.status(200).send("Welcome email sent successfully");
  } catch (error) {
    console.error("Error sending welcome email:", error);
    res.status(500).send("Error sending welcome email");
  }
};

// Send Reset Password Email
exports.sendResetPasswordEmail = async (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).send("Email is required.");

  try {
    // Find the person by email only - don't use person.id in the search criteria
    const person = await Person.findOne({
      where: { email },
    });

    if (!person) return res.status(404).send("Email not found.");

    const { v4: uuidv4 } = require("uuid"); // Make sure uuid is imported
    const resetToken = uuidv4();
    const redirectURL = `${process.env.REDIRECT_URL}/${resetToken}`;

    // Uncomment when ready to send emails
    await sendEmail(email, "Reset Your Password", "reset-email-password", {
      first_name: person.first_name || "Friend",
      redirectURL,
      resetToken,
    });

    // console.log("VALUES:, person_id:", person.id);
    // console.log("VALUES:, resetToken:", resetToken);
    // console.log("VALUES:, person_id:", person.id);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    console.log("VALUES:, expiresAt:", expiresAt);

    // Log the model and table name for debugging
    // console.log("Model tableName:", ChangedPasswordToken.tableName);
    // console.log("Creating token with data:", {
    //   person_id_fk: person.id,
    //   token: resetToken,
    //   email: person.email,
    //   expires_at: expiresAt,
    // });

    try {
      await ChangedPasswordToken.create({
        person_id_fk: person.id,
        token: resetToken,
        email: person.email,
        expires_at: expiresAt,
        // Let Sequelize handle timestamps automatically
      });
      console.log("Token created successfully");
    } catch (tokenError) {
      console.error("Error creating token:", tokenError);
      throw tokenError; // Re-throw to be caught by outer catch block
    }

    req.session.emailStatus = "Reset password email sent successfully.";
    req.session.save(() => res.redirect("/email-status"));
  } catch (error) {
    console.error("Error resetting password:", error);
    req.session.emailStatus = "Error resetting password.";
    req.session.save(() => res.redirect("/email-status"));
  }
};

// Get Change Password Page
exports.getChangePassword = async (req, res) => {
  const token = req.params.token;
  let person_id_fk = ""; // Use let instead of const
  console.log("getChangePassword", token);
  try {
    // Find the token in the database
    const tokenRecord = await ChangedPasswordToken.findOne({
      where: { token },
    });
    if (!tokenRecord) {
      return res.status(404).send("Invalid or expired token.");
    }
    const person = await Person.findByPk(tokenRecord.person_id_fk);

    person_id_fk = tokenRecord.person_id_fk; // Reassign the value
    console.log("person_id_fk:", person_id_fk);

    // Check if the token has expired
    const currentTime = new Date();
    if (currentTime > tokenRecord.expires_at) {
      return res.status(400).send("Token has expired.");
    }
    console.log("person:", person.email);
    if (!person) {
      res.render("Pages/pages-change-password", {
        token,
        person_id: person_id_fk,
        email: person.email,
        layout: "layout-public",
      });
    } else {
      res.render("Pages/pages-change-password", {
        token,
        person_id: person_id_fk,
        email: person.email,
        layout: "layout-public",
      });
    }
  } catch (error) {
    console.error("Error retrieving change password page:", error);
    res.status(500).send("Internal Server Error");
  }
};
exports.updatePassword = async (req, res) => {
  const token = req.params.token;
  const person_id_fk = req.params.person_id;
  console.log("UPDATE PASSWORD", token);
  console.log("UPDATE PASSWORD", req.params.person_id);

  const { password } = req.body;
  console.log("UPDATE PASSWORD", password);

  if (!password) {
    return res.status(400).send("Password is required.");
  }

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find the token in the database
    const tokenRecord = await ChangedPasswordToken.findOne({
      where: { token },
    });

    if (!tokenRecord) {
      return res.status(404).send("Invalid or expired token.");
    }

    // Check if the token has expired
    const currentTime = new Date();
    if (currentTime > tokenRecord.expires_at) {
      return res.status(400).send("Token has expired.");
    }
    console.log("hashedPassword", hashedPassword);
    // Update the person's password
    const [updated] = await Person.update(
      { password: hashedPassword }, // Update the password field
      { where: { id: tokenRecord.person_id_fk } }, // Match the person by ID
    );

    if (!updated) {
      return res
        .status(404)
        .send("Person not found or password update failed.");
    }

    console.log(
      "Password updated successfully for person_id:",
      tokenRecord.person_id_fk,
    );

    // Optionally, delete the token after successful password update
    await ChangedPasswordToken.destroy({
      where: { person_id_fk: tokenRecord.person_id },
    });
    req.session.emailStatus = "Password updated successfully.";
    req.session.save(() => res.redirect("/emailSuccess"));
    // render success page with login button.
    // res.status(200).send("Password updated successfully.");
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).send("Internal Server Error");
  }
};
