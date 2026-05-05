const Sequelize = require("sequelize");
const sequelize = require("../index").sequelize;

const Session = sequelize.define("Session", {
  sid: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  expires: Sequelize.DATE,
  data: Sequelize.TEXT,
});

module.exports = Session;
