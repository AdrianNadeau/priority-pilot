require("dotenv").config();

module.exports = {
  HOST: process.env.DB_HOST_NAME,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD,
  DB: process.env.DB_NAME,
  dialect: "postgres",
  pool: {
    max: 200, // Maximum number of connections in the pool
    min: 5, // Minimum number of connections
    acquire: 30000, // Maximum time (ms) to try getting a connection before throwing an error
    idle: 10000, // Time (ms) before an idle connection is released
    evict: 15000, // Time (ms) before Sequelize removes an idle connection
  },
};
