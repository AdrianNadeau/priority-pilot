const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
require("dotenv").config();

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
console.log("ENVIRONMENT", env);
console.log("LOGGING:", process.env.DB_LOGGING);
const db = {};

// Determine if we need SSL (only for remote databases, not localhost)
const isRemoteDB = !process.env.DB_URL.includes("localhost");
const dialectOptions = isRemoteDB
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }
  : {};

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "postgres",
  logging: process.env.DB_LOGGING ? process.env.DB_LOGGING === "true" : true,
  dialectOptions: dialectOptions,
  pool: {
    max: 100,
    min: 2,
    acquire: 30000,
    idle: 30000,
  },
});
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
db.changed_password_token = require("./changed_password_token.model.js")(
  sequelize,
  Sequelize.DataTypes,
);
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
