const TestDataManager = require("./testDataManager");
const TestDataFactory = require("../fixtures/testDataFactory");

/**
 * Test setup helper for managing test environment
 */
class TestSetupHelper {
  constructor() {
    this.dataManager = new TestDataManager();
    this.dataFactory = new TestDataFactory();
    this.isSetup = false;
  }

  // Setup test environment
  async setup() {
    if (this.isSetup) {
      return;
    }

    try {
      console.log("Setting up test environment...");

      // Create test database if needed
      await this.dataManager.createTestDatabase();

      // Connect to test database
      await this.dataManager.connect();

      // Sync database models
      await this.dataManager.syncModels(false);

      this.isSetup = true;
      console.log("Test environment setup completed.");
    } catch (error) {
      console.error("Test setup failed:", error);
      throw error;
    }
  }

  // Teardown test environment
  async teardown() {
    if (!this.isSetup) {
      return;
    }

    try {
      console.log("Tearing down test environment...");

      // Cleanup data
      await this.dataManager.cleanup();

      // Disconnect from database
      await this.dataManager.disconnect();

      this.isSetup = false;
      console.log("Test environment teardown completed.");
    } catch (error) {
      console.error("Test teardown failed:", error);
      throw error;
    }
  }

  // Reset test environment
  async reset() {
    try {
      console.log("Resetting test environment...");

      if (this.isSetup) {
        await this.dataManager.resetDatabase();
      } else {
        await this.setup();
        await this.dataManager.resetDatabase();
      }

      // Reset factory sequences
      this.dataFactory.resetSequences();

      console.log("Test environment reset completed.");
    } catch (error) {
      console.error("Test reset failed:", error);
      throw error;
    }
  }

  // Setup test scenario
  async setupScenario(scenario = "default") {
    try {
      console.log(`Setting up test scenario: ${scenario}`);

      // Ensure test environment is ready
      if (!this.isSetup) {
        await this.setup();
      }

      // Clean existing data
      await this.dataManager.cleanAllTables();

      // Generate scenario data
      const scenarioData = this.dataFactory.generateScenarioData(scenario);

      // Load scenario data into database
      if (scenarioData.companies.length > 0) {
        this.dataManager.registerFixture("companies", scenarioData.companies);
        await this.dataManager.loadFixture("companies", "companies");
      }

      if (scenarioData.users.length > 0) {
        this.dataManager.registerFixture("users", scenarioData.users);
        await this.dataManager.loadFixture("users", "persons");
      }

      if (scenarioData.phases.length > 0) {
        this.dataManager.registerFixture("phases", scenarioData.phases);
        await this.dataManager.loadFixture("phases", "phases");
      }

      if (scenarioData.priorities.length > 0) {
        this.dataManager.registerFixture("priorities", scenarioData.priorities);
        await this.dataManager.loadFixture("priorities", "priorities");
      }

      if (scenarioData.statuses.length > 0) {
        this.dataManager.registerFixture("statuses", scenarioData.statuses);
        await this.dataManager.loadFixture("statuses", "statuses");
      }

      if (scenarioData.tags && scenarioData.tags.length > 0) {
        this.dataManager.registerFixture("tags", scenarioData.tags);
        await this.dataManager.loadFixture("tags", "tags");
      }

      if (scenarioData.projects.length > 0) {
        this.dataManager.registerFixture("projects", scenarioData.projects);
        await this.dataManager.loadFixture("projects", "projects");
      }

      console.log(`Test scenario '${scenario}' setup completed.`);
      return scenarioData;
    } catch (error) {
      console.error(`Test scenario '${scenario}' setup failed:`, error);
      throw error;
    }
  }

  // Create isolated test transaction
  async createTestTransaction() {
    if (!this.isSetup) {
      await this.setup();
    }

    return await this.dataManager.createTransaction();
  }

  // Execute test within transaction (auto-rollback)
  async runInTransaction(testFn) {
    const transaction = await this.createTestTransaction();

    try {
      const result = await testFn(transaction);
      return result;
    } finally {
      // Always rollback to maintain test isolation
      await this.dataManager.rollbackTransaction(transaction);
    }
  }

  // Get test data factory
  getFactory() {
    return this.dataFactory;
  }

  // Get data manager
  getDataManager() {
    return this.dataManager;
  }

  // Quick setup for unit tests
  async quickSetup() {
    if (!this.isSetup) {
      await this.setup();
      await this.setupScenario("minimal");
    }
  }

  // Full setup for integration tests
  async fullSetup() {
    if (!this.isSetup) {
      await this.setup();
      await this.setupScenario("default");
    }
  }

  // Performance test setup
  async performanceSetup() {
    if (!this.isSetup) {
      await this.setup();
      await this.setupScenario("large");
    }
  }

  // Clean setup for each test
  async cleanSetup() {
    if (!this.isSetup) {
      await this.setup();
    }

    await this.dataManager.cleanAllTables();
    this.dataFactory.resetSequences();
  }

  // Create test user session data
  createTestSession(userOverrides = {}) {
    const user = this.dataFactory.person(userOverrides);
    const company = this.dataFactory.company();

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      company: {
        id: company.id,
        name: company.company_name,
      },
    };
  }

  // Wait for async operations
  async waitFor(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Helper to check if test database is ready
  async isTestDatabaseReady() {
    try {
      await this.dataManager.connect();
      await this.dataManager.disconnect();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Backup current test data
  async backupTestData() {
    const backup = {};

    try {
      const tableNames = await this.dataManager.getTableNames();

      for (const tableName of tableNames) {
        const [results] = await this.dataManager.sequelize.query(
          `SELECT * FROM "${tableName}"`,
        );
        backup[tableName] = results;
      }

      return backup;
    } catch (error) {
      console.error("Error backing up test data:", error);
      throw error;
    }
  }

  // Restore test data from backup
  async restoreTestData(backup) {
    try {
      await this.dataManager.cleanAllTables();

      for (const [tableName, rows] of Object.entries(backup)) {
        if (rows.length > 0) {
          this.dataManager.registerFixture(`backup_${tableName}`, rows);
          await this.dataManager.loadFixture(`backup_${tableName}`, tableName);
        }
      }

      console.log("Test data restored from backup.");
    } catch (error) {
      console.error("Error restoring test data:", error);
      throw error;
    }
  }
}

// Create singleton instance
const testSetupHelper = new TestSetupHelper();

// Global setup and teardown hooks for Jest
global.beforeAll(async () => {
  await testSetupHelper.setup();
});

global.afterAll(async () => {
  await testSetupHelper.teardown();
});

global.beforeEach(async () => {
  await testSetupHelper.cleanSetup();
});

global.afterEach(async () => {
  await testSetupHelper.dataManager.cleanup();
});

module.exports = TestSetupHelper;
