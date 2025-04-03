require("dotenv").config();

module.exports = {
  HOST: process.env.DB_HOST_NAME,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD,
  DB: process.env.DB_NAME,
  dialect: "postgres",
  pool: {
    max: 50,
    min: 2,
    acquire: 30000,
    idle: 30000,
  },
};
