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
const ChangedPasswordToken = db.ChangePasswordToken;

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
    const person = await Person.findOne({ where: { email } });
    if (!person) return res.status(404).send("Email not found.");

    const resetToken = uuidv4();
    const redirectURL = `${process.env.REDIRECT_URL}/${resetToken}`;

    await sendEmail(email, "Reset Your Password", "reset-email-password", {
      first_name: person.first_name || "Friend",
      redirectURL,
      resetToken,
    });

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await ChangedPasswordToken.create({
      person_id_fk: person.id,
      token: resetToken,
      email: person.email,
      created_at: new Date(),
      expires_at: expiresAt,
    });

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
  try {
    const tokenRecord = await ChangedPasswordToken.findOne({
      where: { token },
    });
    if (!tokenRecord || new Date() > tokenRecord.expires_at) {
      const error = new Error(
        "Invalid or expired token. Click here to try again.",
      );
      error.statusCode = 401;
      throw error;
    }

    const person = await Person.findByPk(tokenRecord.person_id_fk);
    if (!person) {
      return res.status(404).send("User not found.");
    }

    res.render("Pages/pages-change-password", {
      email: person.email,
      token: token,
      layout: "layout-public",
    });
  } catch (error) {
    console.error("Error retrieving change password page:", error);
    res.status(500).send("Internal Server Error");
  }
};
exports.getChangePassword = async (req, res) => {
  const token = req.params.token;
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
    console.log("person:", person);
    const person_id_fk = tokenRecord.person_id_fk;
    console.log("person_id_fk:", person_id_fk);

    // Check if the token has expired
    const currentTime = new Date();
    if (currentTime > tokenRecord.expires_at) {
      return res.status(400).send("Token has expired.");
    }
  } catch (error) {
    console.error("Error retrieving change password page:", error);
    res.status(500).send("Internal Server Error");
  }
  try {
    // // Find the person by email
    // const person = await Person.findOne({ where: { email } });
    // if (!person) {
    //   return res.status(404).send("Email not found.");
    // }
    // console.log("person:", person.id);

    // // Generate a unique reset token
    // const resetToken = uuidv4();

    // // Generate the redirect URL
    // const redirectURL = `${process.env.REDIRECT_URL}/${resetToken}`;

    // // Prepare email template data
    // const templateData = {
    //   first_name: person.first_name || "Friend",
    //   redirectURL, // Pass the redirect URL to the template
    //   resetToken,
    // };
    // console.log("templateData:", templateData);
    // // Send the reset password email
    // await sendEmail(
    //   email,
    //   "Reset Your Password",
    //   "reset-email-password",
    //   templateData,
    //   resetToken,
    // );

    //add 10 minutes before the token expires
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const changedPasswordToken = await ChangedPasswordToken.findAll({
      where: { token: token },
    });
    res.render("Pages/pages-change-password", { token });
  } catch (error) {
    console.error("Error resetting password:", error);
    req.session.emailStatus = "Error resetting password.";
    req.session.save(() => {
      res.redirect("/email-status");
    });
  }
};
