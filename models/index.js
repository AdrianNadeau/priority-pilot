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

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

db.companies = require("./company.model.js")(sequelize, Sequelize);
db.persons = require("./person.model.js")(sequelize, Sequelize);
db.change_logs = require("./change_log.model.js")(sequelize, Sequelize);
db.change_logs_reason = require("./change_reason.model.js")(sequelize, Sequelize);
db.projects = require("./project.model.js")(sequelize, Sequelize);
db.priorities = require("./priority.model.js")(sequelize, Sequelize);
db.tags = require("./tag.model.js")(sequelize, Sequelize);
db.statuses = require("./status.model.js")(sequelize, Sequelize);
db.phases = require("./phase.model.js")(sequelize, Sequelize);
db.change_reasons = require("./change_reason.model.js")(sequelize, Sequelize);
db.changed_projects = require("./changed_project.model.js")(sequelize, Sequelize);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
