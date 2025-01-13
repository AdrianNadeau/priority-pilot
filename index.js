var app = require("express")();
var express = require("express");
var session = require("express-session");
var path = require("path");
var http = require("http").Server(app);
var bCrypt = require("bcryptjs");
const multer = require("multer");

// Import Sequelize
const { Sequelize } = require("sequelize");

var router = require("./router.js");
var Authrouter = require("./routes/AuthRouter.js");
var DashboardRouter = require("./routes/DashboardRouter.js");

var authMiddleware = require("./middleware/authMiddleware.js");
const connectionString = process.env.DB_URL;

// Initialize Sequelize with the connection URL
// const sequelize = new Sequelize(connectionString);
app.use(express.urlencoded({ extended: true }));

// Access public folder from root
app.use("/public", express.static("public"));
app.get("/layouts/", function (req, res) {
  res.render("view");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true,
  rolling: true, // Force regeneration of session ID for each request
});

app.use(sessionMiddleware);

// Add Authentication Route file with app
app.use("/", Authrouter);
app.use("/control", DashboardRouter);

app.use(authMiddleware);

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/resources/static/assets/uploads/company_logos"); // Directory to store files
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname),
    ); // Unique file name
  },
});

// Serve JavaScript files from the 'utils' directory
app.use("/utils", express.static(path.join(__dirname, "utils")));

//For set layouts of html view
var expressLayouts = require("express-ejs-layouts");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
// Add Route file with app
app.use("/", router);

const db = require("./models");
console.log("LOGGING:", process.env.DB_LOGGING);
// Initialize Sequelize with the connection URL and SSL/TLS options
const sequelize = new Sequelize(connectionString, {
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // You may need to set this to false if using a self-signed certificate
    },
    logging: process.env.DB_LOGGING,
  },
});

require("./routes/company.routes")(app);
require("./routes/person.routes")(app);
require("./routes/change_log.routes")(app);
require("./routes/project.routes")(app);
require("./routes/change_log_details.routes")(app);
require("./routes/phase.routes")(app);
require("./routes/priority.routes")(app);
require("./routes/tag.routes")(app);
require("./routes/status.routes")(app);
require("./routes/phase.routes")(app);
require("./routes/priority.routes")(app);
require("./routes/change_reason.routes.js")(app);
require("./routes/changed_project.routes.js")(app);

// 404 Middleware
// app.use((req, res, next) => {
//   // res.send("NO 404");
//   res.status(404).render("Pages/pages-404", {
//     error: "Resource not found",
//     message: `The requested URL ${req.originalUrl} was not found on this server.`,
//   });
// });

// 500 Error Handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).render("Pages/session", {
//     title: "Internal Server Error",
//     message: "Something went wrong on our end. Please try again later.",
//   });
// });
http.listen(8080, function () {
  console.log("listening on *:8080");
});
