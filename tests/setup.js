// Test environment setup
require("dotenv").config({ path: ".env.test" });

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.DB_NAME = process.env.TEST_DB_NAME || "priority_pilot_test";
process.env.DISABLE_LOGGING = "true";

// Global test setup
beforeEach(async () => {
  // Clear any cached modules
  jest.clearAllMocks();
});

afterEach(async () => {
  // Cleanup after each test
});

// Setup test database connection
const { Sequelize } = require("sequelize");

const testSequelize = new Sequelize(
  process.env.TEST_DB_NAME || "priority_pilot_test",
  process.env.DB_USER_NAME || "postgres",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST_NAME || "localhost",
    dialect: "postgres",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

global.testDb = testSequelize;

// Graceful shutdown
process.on("exit", async () => {
  if (global.testDb) {
    await global.testDb.close();
  }
});
