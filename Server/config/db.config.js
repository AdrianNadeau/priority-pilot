module.exports = {
    HOST: "localhost",
    USER: "priority_pilot",
    PASSWORD: "priority_pilot",
    DB: "priority_pilot",
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };