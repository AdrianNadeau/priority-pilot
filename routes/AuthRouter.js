const db = require("../models");
var express = require("express");
require("dotenv").config();
var Authrouter = express.Router();
const companies = require("../controllers/company.controller");
const persons = require("../controllers/person.controller");
const isAdminMiddleware = require("../middleware/isAdminMiddleware");
// const sendEmail = require("../utils/emailSender");

exports.sendWelcomeEmail = (req, res) => {
  const { email, name } = req.body;

  sendEmail(email, "Welcome to Our Platform", "welcome", { name })
    .then(() => {
      res.status(200).send("Welcome email sent successfully");
    })
    .catch((error) => {
      console.error("Error sending welcome email:", error);
      res.status(500).send("Error sending welcome email");
    });
};

exports.sendResetPasswordEmail = (req, res) => {
  console.log("SEND RESET EMAIL");
  const { email, resetLink } = req.body;

  sendEmail(email, "Reset Your Password", "resetPassword", { resetLink })
    .then(() => {
      res.status(200).send("Reset password email sent successfully");
    })
    .catch((error) => {
      console.error("Error sending reset password email:", error);
      res.status(500).send("Error sending reset password email");
    });
};
//Authentications all TABs.
Authrouter.get("/login", function (req, res) {
  res.render("Pages/pages-login");
});
Authrouter.post("/login", function (req, res) {
  res.render("Pages/pages-login");
});
Authrouter.get("/pages-login-2", function (req, res) {
  res.render("Pages/pages-login-2");
});

// Authrouter.get("/register", function (req, res) {
//   res.render("Pages/pages-register");
// });
Authrouter.get("/confirm", function (req, res) {
  res.render("Pages/pages-register-confirm");
});
Authrouter.get("/session-expired", function (req, res) {
  res.render("Pages/pages-session-expired");
});
Authrouter.get("/terms", function (req, res) {
  res.render("Pages/pages-terms");
});

Authrouter.get("/help", function (req, res) {
  //get company id
  let sessionValid = false;
  if (!req.session || !req.session.company || !req.session.person) {
    return res.redirect("/pages-500");
  } else {
    sessionValid = true;
  }

  const company_id_fk = req.session.company.id;
  const person_id_fk = req.session.person.id;

  res.render("Pages/pages-help", {
    person_id_fk: person_id_fk,
    company_id_fk: company_id_fk,
    sessionValid,
  });
});
Authrouter.get("/pages-maintenance", function (req, res) {
  res.render("Pages/pages-maintenance");
});
Authrouter.get("Pages/pages-roadmap", function (req, res) {
  //get company id
  if (!req.session || !req.session.company || !req.session.person) {
    return res.redirect("/pages-500");
  }

  const company_id_fk = req.session.company.id;
  const person_id_fk = req.session.person.id;

  res.render("Pages/pages-help-roadmap", {
    person_id_fk: person_id_fk,
    company_id_fk: company_id_fk,
  });
});
// Authrouter.post("/register", companies.create);
Authrouter.post("/auth/login", persons.login);

Authrouter.get("/pages-maintenance", function (req, res) {
  res.render("Pages/pages-maintenance");
});

Authrouter.get("/session-expired", function (req, res) {
  console.log("Rendering session expired page");
  res.render("Pages/pages-session-expired");
});

Authrouter.get("/auth/reset-password", function (req, res) {
  res.render("Pages/pages-reset-password");
});
Authrouter.get("/recover-password", function (req, res) {
  res.render("Pages/pages-recoverpw");
});
Authrouter.post("/auth/login", persons.login);
Authrouter.post("/reset-email-password", function (req, res) {
  //create unique token to send user if email exists
  const email = req.body.email;

  res.send("Email sent to " + email);
  // persons.findOne(email, res);
});

// Authrouter.get("/test", function (req, res) {
//   res.render("Pages/pages-reset-password");
// });
// Authrouter.get('/pages-coming-soon', function(req, res)
// {
//       res.render('Pages/pages-coming-soon');
// });
// Authrouter.get('/pages-lock-screen', function(req, res)
// {
//       res.render('Pages/pages-lock-screen');
// });
// Authrouter.get('/pages-lock-screen-2', function(req, res)
// {
//       res.render('Pages/pages-lock-screen-2');
// });
// Authrouter.get('/pages-maintenance', function(req, res)
// {
//       res.render('Pages/pages-maintenance');
// });

// Authrouter.get('/pages-recoverpw-2', function(req, res)
// {
//       res.render('Pages/pages-recoverpw-2');
// });
// router.get("/about", function (req, res) {
//       res.send("About this wiki");
//     });

// Authrouter.get('/pages-coming-soon', function(req, res)
// {
//       res.render('Pages/pages-comingsoon');
// });
// Authrouter.get('/logout', function(req, res) {
//       try {
//           fetch(process.env.SERVER_HOST + "/logout")
//               .then(response => {
//                   if (!response.ok) {
//                       throw new Error('Network response was not ok');
//                   } else {
//                       // destroy session
//                       res.redirect('/register');
//                   }
//               })
//               .catch(error => {
//                   console.error('Error sending data:', error);
//                   res.status(500).json({ error: error.message });
//               });
//       } catch (error) {
//           console.error('Error:', error);
//           res.status(500).json({ error: error.message });
//       }
//   });
Authrouter.get("/logout", function (req, res) {
  // Destroy session on the server-side
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Error logging out");
    } else {
      // Clear cookie on the client-side
      res.clearCookie("connect.sid", { path: "/" });
      res.redirect("/login"); // Redirect to login page or any other page
    }
  });
});

module.exports = Authrouter;
