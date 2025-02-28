require("dotenv").config();

module.exports = {
  HOST: process.env.DB_HOST_NAME,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD,
  DB: process.env.DB_NAME,
  dialect: "postgres",
  pool: {
    max: 100, // Maximum number of connections in the pool
    min: 2, // Minimum number of connections
    acquire: 50000,
    idle: 50000,
    evict: 100000, // Time (ms) before Sequelize removes an idle connection
  },
};
