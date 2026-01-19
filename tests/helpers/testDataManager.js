const { Sequelize } = require("sequelize");

class TestDataManager {
  constructor(config = {}) {
    this.sequelize = new Sequelize(
      config.database || process.env.TEST_DB_NAME || "priority_pilot_test",
      config.username || process.env.DB_USER_NAME || "postgres",
      config.password || process.env.DB_PASSWORD || "",
      {
        host: config.host || process.env.DB_HOST_NAME || "localhost",
        port: config.port || process.env.DB_PORT || 5432,
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

    this.fixtures = new Map();
    this.cleanupTasks = [];
  }

  // Initialize database connection
  async connect() {
    try {
      await this.sequelize.authenticate();
      console.log("Test database connection established successfully.");
      return true;
    } catch (error) {
      console.error("Unable to connect to test database:", error);
      throw error;
    }
  }

  // Close database connection
  async disconnect() {
    try {
      await this.sequelize.close();
      console.log("Test database connection closed.");
    } catch (error) {
      console.error("Error closing test database connection:", error);
      throw error;
    }
  }

  // Create test database if it doesn't exist
  async createTestDatabase() {
    const mainSequelize = new Sequelize(
      "postgres",
      process.env.DB_USER_NAME || "priority_pilot",
      process.env.DB_PASSWORD || "priority_pilot",
      {
        host: process.env.DB_HOST_NAME || "localhost",
        port: process.env.DB_PORT || 5432,
        dialect: "postgres",
        logging: false,
      },
    );

    try {
      await mainSequelize.authenticate();
      const testDbName = process.env.TEST_DB_NAME || "priority_pilot_test";

      // Check if database exists
      const [results] = await mainSequelize.query(
        `SELECT 1 FROM pg_database WHERE datname = '${testDbName}'`,
      );

      if (results.length === 0) {
        await mainSequelize.query(`CREATE DATABASE "${testDbName}"`);
        console.log(`Test database '${testDbName}' created successfully.`);
      }

      await mainSequelize.close();
    } catch (error) {
      console.error("Error creating test database:", error);
      await mainSequelize.close();
      throw error;
    }
  }

  // Drop test database
  async dropTestDatabase() {
    const mainSequelize = new Sequelize(
      "postgres",
      process.env.DB_USER_NAME || "priority_pilot_test",
      process.env.DB_PASSWORD || "priority_pilot",
      {
        host: process.env.DB_HOST_NAME || "localhost",
        port: process.env.DB_PORT || 5432,
        dialect: "postgres",
        logging: false,
      },
    );

    try {
      await mainSequelize.authenticate();
      const testDbName = process.env.TEST_DB_NAME || "priority_pilot_test";

      // Terminate all connections to the test database
      await mainSequelize.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${testDbName}' AND pid <> pg_backend_pid()
      `);

      await mainSequelize.query(`DROP DATABASE IF EXISTS "${testDbName}"`);
      console.log(`Test database '${testDbName}' dropped successfully.`);

      await mainSequelize.close();
    } catch (error) {
      console.error("Error dropping test database:", error);
      await mainSequelize.close();
      throw error;
    }
  }

  // Sync database models
  async syncModels(force = false) {
    try {
      await this.sequelize.sync({ force });
      console.log(`Database models synced${force ? " (force)" : ""}.`);
    } catch (error) {
      console.error("Error syncing database models:", error);
      throw error;
    }
  }

  // Clean all tables
  async cleanAllTables() {
    try {
      const tableNames = await this.getTableNames();

      // Disable foreign key checks
      await this.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

      // Truncate all tables
      for (const tableName of tableNames) {
        await this.sequelize.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`,
        );
      }

      // Re-enable foreign key checks
      await this.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("All tables cleaned successfully.");
    } catch (error) {
      console.error("Error cleaning tables:", error);
      throw error;
    }
  }

  // Get all table names
  async getTableNames() {
    try {
      const [results] = await this.sequelize.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE '%SequelizeMeta%'
      `);

      return results.map((row) => row.tablename);
    } catch (error) {
      console.error("Error getting table names:", error);
      throw error;
    }
  }

  // Register fixture data
  registerFixture(name, data) {
    this.fixtures.set(name, data);
  }

  // Get fixture data
  getFixture(name) {
    return this.fixtures.get(name);
  }

  // Load fixture data into database
  async loadFixture(name, tableName) {
    const data = this.getFixture(name);
    if (!data) {
      throw new Error(`Fixture '${name}' not found`);
    }

    try {
      // Insert data
      if (Array.isArray(data)) {
        await this.sequelize.query(`
          INSERT INTO "${tableName}" (${Object.keys(data[0])
            .map((k) => `"${k}"`)
            .join(", ")})
          VALUES ${data
            .map(
              (row) =>
                `(${Object.values(row)
                  .map((v) => this.sequelize.escape(v))
                  .join(", ")})`,
            )
            .join(", ")}
        `);
      } else {
        await this.sequelize.query(`
          INSERT INTO "${tableName}" (${Object.keys(data)
            .map((k) => `"${k}"`)
            .join(", ")})
          VALUES (${Object.values(data)
            .map((v) => this.sequelize.escape(v))
            .join(", ")})
        `);
      }

      console.log(`Fixture '${name}' loaded into table '${tableName}'.`);

      // Register cleanup task
      this.cleanupTasks.push(() => this.cleanTable(tableName));
    } catch (error) {
      console.error(`Error loading fixture '${name}':`, error);
      throw error;
    }
  }

  // Clean specific table
  async cleanTable(tableName) {
    try {
      await this.sequelize.query(
        `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`,
      );
      console.log(`Table '${tableName}' cleaned.`);
    } catch (error) {
      console.error(`Error cleaning table '${tableName}':`, error);
      throw error;
    }
  }

  // Execute all cleanup tasks
  async cleanup() {
    for (const cleanupTask of this.cleanupTasks) {
      try {
        await cleanupTask();
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    }

    this.cleanupTasks = [];
    console.log("Cleanup completed.");
  }

  // Create a transaction for test isolation
  async createTransaction() {
    return await this.sequelize.transaction();
  }

  // Execute query within transaction
  async executeInTransaction(transaction, query, options = {}) {
    return await this.sequelize.query(query, {
      transaction,
      ...options,
    });
  }

  // Rollback transaction
  async rollbackTransaction(transaction) {
    await transaction.rollback();
  }

  // Generate test data
  async generateTestData() {
    try {
      // Generate companies
      const companies = [
        {
          id: 1,
          company_name: "Test Company 1",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          company_name: "Test Company 2",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      this.registerFixture("companies", companies);

      // Generate users
      const users = [
        {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@test.com",
          password: "$2a$10$hashedpassword",
          company_id_fk: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          first_name: "Jane",
          last_name: "Smith",
          email: "jane.smith@test.com",
          password: "$2a$10$hashedpassword",
          company_id_fk: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      this.registerFixture("users", users);

      // Generate phases
      const phases = [
        {
          id: 1,
          phase_name: "Planning",
          phase_description: "Project planning phase",
        },
        {
          id: 2,
          phase_name: "Development",
          phase_description: "Development phase",
        },
        { id: 3, phase_name: "Testing", phase_description: "Testing phase" },
        {
          id: 4,
          phase_name: "Deployment",
          phase_description: "Deployment phase",
        },
      ];
      this.registerFixture("phases", phases);

      // Generate priorities
      const priorities = [
        { id: 1, priority_name: "Low", priority_description: "Low priority" },
        {
          id: 2,
          priority_name: "Medium",
          priority_description: "Medium priority",
        },
        { id: 3, priority_name: "High", priority_description: "High priority" },
        {
          id: 4,
          priority_name: "Critical",
          priority_description: "Critical priority",
        },
      ];
      this.registerFixture("priorities", priorities);

      // Generate statuses
      const statuses = [
        { id: 1, status_name: "Active", status_description: "Active status" },
        { id: 2, status_name: "On Hold", status_description: "On hold status" },
        {
          id: 3,
          status_name: "Completed",
          status_description: "Completed status",
        },
        {
          id: 4,
          status_name: "Cancelled",
          status_description: "Cancelled status",
        },
      ];
      this.registerFixture("statuses", statuses);

      // Generate projects
      const projects = [
        {
          id: 1,
          project_name: "Test Project 1",
          project_description: "First test project",
          start_date: "2024-01-01",
          end_date: "2024-06-30",
          company_id_fk: 1,
          phase_id_fk: 1,
          priority_id_fk: 2,
          person_id_fk: 1,
          status_id_fk: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          project_name: "Test Project 2",
          project_description: "Second test project",
          start_date: "2024-03-01",
          end_date: "2024-09-30",
          company_id_fk: 1,
          phase_id_fk: 2,
          priority_id_fk: 3,
          person_id_fk: 2,
          status_id_fk: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      this.registerFixture("projects", projects);

      console.log("Test data fixtures generated successfully.");
    } catch (error) {
      console.error("Error generating test data:", error);
      throw error;
    }
  }

  // Load all fixtures into database
  async loadAllFixtures() {
    try {
      await this.loadFixture("companies", "companies");
      await this.loadFixture("users", "persons");
      await this.loadFixture("phases", "phases");
      await this.loadFixture("priorities", "priorities");
      await this.loadFixture("statuses", "statuses");
      await this.loadFixture("projects", "projects");

      console.log("All fixtures loaded successfully.");
    } catch (error) {
      console.error("Error loading fixtures:", error);
      throw error;
    }
  }

  // Reset database to clean state and load fixtures
  async resetDatabase() {
    try {
      await this.cleanAllTables();
      await this.generateTestData();
      await this.loadAllFixtures();

      console.log("Database reset completed successfully.");
    } catch (error) {
      console.error("Error resetting database:", error);
      throw error;
    }
  }
}

module.exports = TestDataManager;
