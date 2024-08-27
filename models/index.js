const dbConfig = require("../config/db.config.js");
require('dotenv').config()
const Sequelize = require("sequelize");
const url = process.env.DB_URL;

const sequelize = new Sequelize(url, {
  // host: process.env.DB_HOST_NAME,
  dialect: "postgres",

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Alternative configuration for production
/*
const sequelize = new Sequelize('postgres://priority_pilot:n7QAVbScSd2stT9G5SJtSswr3BYVcH0e@dpg-cr1lqcdumphs73afiv0g-a/priority_pilot_prod', {
  host: process.env.DB_HOST_NAME,
  dialect: "postgres",

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
*/


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