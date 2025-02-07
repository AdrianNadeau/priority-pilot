// const dbConfig = require("../config/db.config.js");

// const Sequelize = require("sequelize");
// const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
//   host: dbConfig.HOST,
//   dialect: dbConfig.dialect,
//   operatorsAliases: false,

//   pool: {
//     max: dbConfig.pool.max,
//     min: dbConfig.pool.min,
//     acquire: dbConfig.pool.acquire,
//     idle: dbConfig.pool.idle
//   }
// });

// const db = {};

// db.Sequelize = Sequelize;
// // db.sequelize = sequelize;

// db.companies = require("./company.model.js")(sequelize, Sequelize);
// db.persons = require("./person.model.js")(sequelize, Sequelize);
// db.change_logs = require("./change_log.model.js")(sequelize, Sequelize);
// db.projects = require("./project.model.js")(sequelize, Sequelize);
// db.priorities = require("./priority.model.js")(sequelize, Sequelize);
// db.tags = require("./tag.model.js")(sequelize, Sequelize);
// db.statuses = require("./status.model.js")(sequelize, Sequelize);
// db.phases = require("./phase.model.js")(sequelize, Sequelize);

// module.exports = db;

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
require("dotenv").config();

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
console.log("ENVIRONMENT", env);
console.log("LOGGING:", process.env.DB_LOGGING);
const db = {};
// Initialize Sequelize with the connection URL
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "postgres",
  logging: process.env.DB_LOGGING === "true",
});
console.log("DB NEW URL", process.env.DB_URL);
// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     dialect: process.env.DB_DIALECT,
//   },
// );

db.companies = require("./company.model.js")(sequelize, Sequelize);
db.persons = require("./person.model.js")(sequelize, Sequelize);
db.change_logs = require("./change_log.model.js")(sequelize, Sequelize);
db.change_logs_reason = require("./change_reason.model.js")(
  sequelize,
  Sequelize,
);
db.projects = require("./project.model.js")(sequelize, Sequelize);
db.priorities = require("./priority.model.js")(sequelize, Sequelize);
db.tags = require("./tag.model.js")(sequelize, Sequelize);
db.statuses = require("./status.model.js")(sequelize, Sequelize);
db.phases = require("./phase.model.js")(sequelize, Sequelize);
db.change_reasons = require("./change_reason.model.js")(sequelize, Sequelize);
db.changed_projects = require("./changed_project.model.js")(
  sequelize,
  Sequelize.DataTypes,
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
