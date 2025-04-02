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
    if (!company) {
      const error = new Error("Company not found.");
      error.statusCode = 404;
      throw error;
    }

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
    console.log("isAdminStatus:", isAdminStatus);
    const hashedPassword = await bcrypt.hash(password, 10);

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
      req.session.company = company;
      req.session.person = newPerson;
    }
    console.log("Redirecting to Dashboard...");

    res.redirect(register_yn === "y" ? "/" : "/persons");
  } catch (error) {
    next(error);
  }
};

// Get all users for the company
exports.findAll = async (req, res, next) => {
  console.log("find all");
  try {
    const company_id_fk = req.session.company?.id;
    if (!company_id_fk) return res.redirect("/pages-500");

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
    if (!company) {
      return res.redirect("/login");
    } else {
      req.session.company = company;
      req.session.person = person;
      console.log("Redirecting to Dashboard...");
      res.redirect("/");
    }
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

exports.sendWelcomeEmail = async (req, res) => {
  console.log(".....Sending WelcomeEmail....");
  const pesronFirstName = req.session.person?.first_name;
  const personEmail = req.session.person?.email;

  console.log("person:", pesronFirstName);
  console.log("personEmail:", personEmail);

  // const email = "adrian@prioritypilot.ca";
  try {
    await sendEmail(email, "Welcome to Priority Pilot!", "welcome", {
      first_name: pesronFirstName,
    });
    res.status(200).send("Welcome email sent successfully");
  } catch (error) {
    console.error("Error sending welcome email:", error);
    res.status(500).send("Error sending welcome email");
  }
};
exports.changePassword = async (req, res) => {
  console.log(".....Sending setCheckPassword....");
  const token = req.parameter.token;
  console.log("token:", token);
  res.render("pages-reset-password", {
    token: token,
  });

  // const email = "adrian@ansoftwareservices.com";
  // // if (!req.body.email) {
  // //   return res.status(400).send("Email is required.");
  // // }
  // console.log("FIND PERSON BY EMAIL");
  // const person = await Person.findOne({
  //   where: { email: email },
  // });
  // if (!person) {
  //   return res.status(404).send("Email not found.");
  // }

  // console.log("Person found:", person.first_name);
  // const resetToken = uuidv4(); // Generate a unique identifier for the token
  // const redirectURL = `${process.env.REDIRECT_URL || "https://www.prioritypilot.ca/persons/ChangePassword"}?token=${resetToken}`;

  // const templateData = {
  //   first_name: req.body.first_name || "User",
  //   redirectURL, // Pass the redirect URL to the template
  // };

  // try {
  //   console.log("Send Email to:", email);
  //   await sendEmail(
  //     email,
  //     "Reset Your Password",
  //     "reset-email-password",
  //     templateData,
  //   );

  //     res.redirect("/persons/");;
  //   } catch (error) {
  //     console.error("Error sending reset password email:", error);
  //     res.status(500).send("Error sending reset password email.");
  //   }
};
exports.sendResetPasswordEmail = async (req, res) => {
  const email = req.body.email;
  // const email = "adrian@ansoftwareservices.com";
  if (!req.body.email) {
    return res.status(400).send("Email is required.");
  }

  const person = await Person.findOne({
    where: { email: email },
  });
  if (!person) {
    return res.status(404).send("Email not found.");
  }
  const resetToken = uuidv4(); // Generate a unique identifier for the token
  const redirectURL = `${process.env.REDIRECT_URL || "https://www.prioritypilot.ca/pages-change-password"}?token=${resetToken}`;

  const templateData = {
    first_name: req.body.first_name || "User",
    redirectURL, // Pass the redirect URL to the template
  };

  try {
    console.log("Send Email to:", email);
    await sendEmail(
      email,
      "Reset Your Password",
      "reset-email-password",
      templateData,
    );

    //render change password page
    console.log("Redirecting to Change Password page...");
    res.render("Pages/pages-email-status", {
      success: true,
      message: "Reset password email sent successfully.",
    });
    console.log("Insert token into database");
  } catch (error) {
    res.render("Pages/pages-email-status", {
      success: false,
      message: "Error resetting password.",
    });
  }
};
