require("dotenv").config();

module.exports = {
  HOST: process.env.DB_HOST_NAME,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD,
  DB: process.env.DB_NAME,
  dialect: "postgres",
  pool: {
    max: 200,
    min: 0,
    acquire: 40000,
    idleTimeoutMillis: 7200000, // 2 hours
  },
};
