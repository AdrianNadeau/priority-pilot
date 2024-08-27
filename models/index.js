const dbConfig = require("../config/db.config.js");
require('dotenv').config()
const Sequelize = require("sequelize");

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: dbConfig.HOST,
  dialect: process.env.DB_DIALECT,
  operatorsAliases: false,

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.companies = require("./company.model.js")(sequelize, Sequelize);
db.persons = require("./person.model.js")(sequelize, Sequelize);
db.change_logs = require("./change_log.model.js")(sequelize, Sequelize);
db.projects = require("./project.model.js")(sequelize, Sequelize);
db.priorities = require("./priority.model.js")(sequelize, Sequelize);
db.tags = require("./tag.model.js")(sequelize, Sequelize);
db.statuses = require("./status.model.js")(sequelize, Sequelize);
db.phases = require("./phase.model.js")(sequelize, Sequelize);

module.exports = db;