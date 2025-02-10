const dbConfig = require("./config/db.config.js");
var app = require("express")();
var express = require("express");
var session = require("express-session");
var path = require("path");
var http = require("http").Server(app);
var bCrypt = require("bcryptjs");
const multer = require("multer");
require("dotenv").config();
const Sequelize = require("sequelize");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
pg = require("pg");
const pgSession = require("connect-pg-simple")(session);

var router = require("./router.js");
var Authrouter = require("./routes/AuthRouter.js");
var DashboardRouter = require("./routes/DashboardRouter.js");
var authMiddleware = require("./middleware/authMiddleware.js");

app.use(express.urlencoded({ extended: true }));

// Access public folder from root
app.use("/public", express.static("public"));
app.get("/layouts/", function (req, res) {
  res.render("view");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const sessionMiddleware = session({
  store: new pgSession({
    pool: new pg.Pool({
      host: process.env.DB_HOST_NAME,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }),
    tableName: "session", // Use a custom table name if needed
  }),
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 60 * 1000 }, // 30 minutes
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

http.listen(8080, function () {
  console.log("listening on *:8080");
});
