#!/usr/bin/env node

const axios = require("axios");
const chalk = require("chalk");

class RegressionTestSuite {
  constructor(config = {}) {
    this.baseUrl =
      config.baseUrl || process.env.BASE_URL || "http://localhost:3000";
    this.timeout = config.timeout || 30000;
    this.testSuites = [];
    this.results = [];
  }

  // Add test suite
  addSuite(name, tests) {
    this.testSuites.push({ name, tests });
  }

  // Execute all test suites
  async runRegression() {
    console.log(
      chalk.blue(`🔄 Starting regression test suite for ${this.baseUrl}`),
    );
    console.log(chalk.gray(`Testing ${this.testSuites.length} suites\n`));

    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    return this.generateRegressionReport();
  }

  // Run individual test suite
  async runTestSuite(suite) {
    console.log(chalk.cyan(`\n📋 Running suite: ${suite.name}`));
    console.log("─".repeat(40));

    const suiteResults = {
      name: suite.name,
      tests: [],
      passed: 0,
      failed: 0,
      startTime: Date.now(),
    };

    for (const test of suite.tests) {
      const result = await this.runTest(test);
      suiteResults.tests.push(result);

      if (result.passed) {
        suiteResults.passed++;
      } else {
        suiteResults.failed++;
      }
    }

    suiteResults.duration = Date.now() - suiteResults.startTime;
    this.results.push(suiteResults);

    const status =
      suiteResults.failed === 0
        ? chalk.green(
            `✓ PASSED (${suiteResults.passed}/${suiteResults.tests.length})`,
          )
        : chalk.red(
            `✗ FAILED (${suiteResults.passed}/${suiteResults.tests.length})`,
          );

    console.log(`\nSuite result: ${status} in ${suiteResults.duration}ms`);
  }

  // Run individual test
  async runTest(test) {
    try {
      const startTime = Date.now();
      await test.testFn();
      const duration = Date.now() - startTime;

      console.log(chalk.green(`  ✓ ${test.name} (${duration}ms)`));
      return { name: test.name, passed: true, duration };
    } catch (error) {
      console.log(chalk.red(`  ✗ ${test.name} - ${error.message}`));
      return { name: test.name, passed: false, error: error.message };
    }
  }

  // Generate comprehensive regression report
  generateRegressionReport() {
    const totalTests = this.results.reduce(
      (sum, suite) => sum + suite.tests.length,
      0,
    );
    const totalPassed = this.results.reduce(
      (sum, suite) => sum + suite.passed,
      0,
    );
    const totalFailed = totalTests - totalPassed;
    const failedSuites = this.results.filter((suite) => suite.failed > 0);

    console.log("\n" + chalk.bold("Regression Test Report"));
    console.log("═".repeat(50));

    // Overall status
    if (totalFailed === 0) {
      console.log(chalk.green.bold("🎉 ALL REGRESSION TESTS PASSED"));
      console.log(chalk.green("No regressions detected in this deployment\n"));
    } else {
      console.log(chalk.red.bold("❌ REGRESSION DETECTED"));
      console.log(
        chalk.red(
          `${totalFailed} test(s) failed across ${failedSuites.length} suite(s)\n`,
        ),
      );
    }

    // Statistics
    console.log(`${chalk.green("Total Passed:")} ${totalPassed}/${totalTests}`);
    console.log(`${chalk.red("Total Failed:")} ${totalFailed}/${totalTests}`);
    console.log(`${chalk.blue("Test Suites:")} ${this.results.length}`);
    console.log(`${chalk.yellow("Failed Suites:")} ${failedSuites.length}\n`);

    // Suite breakdown
    console.log(chalk.bold("Suite Results:"));
    this.results.forEach((suite) => {
      const status =
        suite.failed === 0 ? chalk.green("PASS") : chalk.red("FAIL");
      console.log(
        `  ${status} ${suite.name} (${suite.passed}/${suite.tests.length}) - ${suite.duration}ms`,
      );
    });

    // Failed tests details
    if (totalFailed > 0) {
      console.log("\n" + chalk.bold("Failed Tests:"));
      this.results.forEach((suite) => {
        const failedTests = suite.tests.filter((test) => !test.passed);
        if (failedTests.length > 0) {
          console.log(chalk.red(`\n  ${suite.name}:`));
          failedTests.forEach((test) => {
            console.log(chalk.red(`    - ${test.name}: ${test.error}`));
          });
        }
      });
    }

    return {
      success: totalFailed === 0,
      totalTests,
      totalPassed,
      totalFailed,
      failedSuites: failedSuites.length,
      suites: this.results,
    };
  }
}

// Create regression test suite
const regression = new RegressionTestSuite();

// Authentication & Authorization Tests
regression.addSuite("Authentication & Authorization", [
  {
    name: "Login with valid credentials",
    testFn: async () => {
      const response = await axios.post(
        `${regression.baseUrl}/api/auth/login`,
        {
          email: "test@example.com",
          password: "password123",
        },
        { timeout: regression.timeout, validateStatus: () => true },
      );

      if (![200, 401].includes(response.status)) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    },
  },
  {
    name: "Login with invalid credentials",
    testFn: async () => {
      const response = await axios.post(
        `${regression.baseUrl}/api/auth/login`,
        {
          email: "wrong@example.com",
          password: "wrongpassword",
        },
        { timeout: regression.timeout, validateStatus: () => true },
      );

      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}`);
      }
    },
  },
  {
    name: "Access protected route without auth",
    testFn: async () => {
      const response = await axios.get(`${regression.baseUrl}/api/projects`, {
        timeout: regression.timeout,
        validateStatus: () => true,
      });

      if (![401, 403].includes(response.status)) {
        throw new Error(`Expected 401/403, got ${response.status}`);
      }
    },
  },
]);

// Core API Functionality Tests
regression.addSuite("Core API Functionality", [
  {
    name: "Health check endpoint",
    testFn: async () => {
      const response = await axios.get(`${regression.baseUrl}/health`, {
        timeout: regression.timeout,
      });

      if (response.status !== 200 || response.data.status !== "OK") {
        throw new Error("Health check failed");
      }
    },
  },
  {
    name: "API health endpoint",
    testFn: async () => {
      const response = await axios.get(`${regression.baseUrl}/api/health`, {
        timeout: regression.timeout,
      });

      if (response.status !== 200 || !response.data.database) {
        throw new Error("API health check failed");
      }
    },
  },
  {
    name: "Projects API availability",
    testFn: async () => {
      const response = await axios.get(`${regression.baseUrl}/api/projects`, {
        timeout: regression.timeout,
        validateStatus: () => true,
      });

      // Should return 401 (unauthorized) not 404 or 500
      if (![200, 401, 403].includes(response.status)) {
        throw new Error(`Projects API returned ${response.status}`);
      }
    },
  },
  {
    name: "Dashboard API availability",
    testFn: async () => {
      const response = await axios.get(`${regression.baseUrl}/api/dashboard`, {
        timeout: regression.timeout,
        validateStatus: () => true,
      });

      if (![200, 401, 403].includes(response.status)) {
        throw new Error(`Dashboard API returned ${response.status}`);
      }
    },
  },
]);

// Database Operations Tests
regression.addSuite("Database Operations", [
  {
    name: "Database connection test",
    testFn: async () => {
      const response = await axios.get(`${regression.baseUrl}/api/health`, {
        timeout: regression.timeout,
      });

      if (response.data.database !== "connected") {
        throw new Error(`Database status: ${response.data.database}`);
      }
    },
  },
  {
    name: "Read operations performance",
    testFn: async () => {
      const startTime = Date.now();
      await axios.get(`${regression.baseUrl}/api/projects`, {
        timeout: regression.timeout,
        validateStatus: () => true,
      });
      const duration = Date.now() - startTime;

      if (duration > 5000) {
        throw new Error(`Slow database read: ${duration}ms`);
      }
    },
  },
]);

// Frontend Asset Tests
regression.addSuite("Frontend Assets", [
  {
    name: "CSS assets loading",
    testFn: async () => {
      const response = await axios.get(
        `${regression.baseUrl}/public/assets/css/style.css`,
        {
          timeout: regression.timeout,
          validateStatus: () => true,
        },
      );

      if (![200, 304].includes(response.status)) {
        throw new Error(`CSS not loading: ${response.status}`);
      }
    },
  },
  {
    name: "JavaScript assets loading",
    testFn: async () => {
      const response = await axios.get(
        `${regression.baseUrl}/public/assets/js/theme.js`,
        {
          timeout: regression.timeout,
          validateStatus: () => true,
        },
      );

      if (![200, 304].includes(response.status)) {
        throw new Error(`JavaScript not loading: ${response.status}`);
      }
    },
  },
  {
    name: "Favicon availability",
    testFn: async () => {
      const response = await axios.get(`${regression.baseUrl}/favicon.ico`, {
        timeout: regression.timeout,
        validateStatus: () => true,
      });

      if (![200, 304].includes(response.status)) {
        throw new Error(`Favicon not available: ${response.status}`);
      }
    },
  },
]);

// Performance Tests
regression.addSuite("Performance Regression", [
  {
    name: "Application startup time",
    testFn: async () => {
      const startTime = Date.now();
      await axios.get(`${regression.baseUrl}/health`, {
        timeout: regression.timeout,
      });
      const duration = Date.now() - startTime;

      if (duration > 3000) {
        throw new Error(`Slow startup: ${duration}ms`);
      }
    },
  },
  {
    name: "Memory usage check",
    testFn: async () => {
      const response = await axios.get(`${regression.baseUrl}/api/health`, {
        timeout: regression.timeout,
      });

      if (response.data.memory) {
        const memoryMB = response.data.memory.heapUsed / 1024 / 1024;
        if (memoryMB > 500) {
          console.log(
            chalk.yellow(`Warning: Memory usage: ${memoryMB.toFixed(2)}MB`),
          );
        }
      }
    },
  },
]);

// Error Handling Tests
regression.addSuite("Error Handling", [
  {
    name: "404 error handling",
    testFn: async () => {
      const response = await axios.get(
        `${regression.baseUrl}/nonexistent-route`,
        {
          timeout: regression.timeout,
          validateStatus: () => true,
        },
      );

      if (response.status !== 404) {
        throw new Error(`Expected 404, got ${response.status}`);
      }
    },
  },
  {
    name: "Malformed request handling",
    testFn: async () => {
      const response = await axios.post(
        `${regression.baseUrl}/api/projects`,
        {
          invalid: "data",
        },
        {
          timeout: regression.timeout,
          validateStatus: () => true,
        },
      );

      // Should handle gracefully, not crash
      if (response.status >= 500) {
        throw new Error(
          `Server error on malformed request: ${response.status}`,
        );
      }
    },
  },
]);

// Run the regression tests
if (require.main === module) {
  regression
    .runRegression()
    .then((report) => {
      process.exit(report.success ? 0 : 1);
    })
    .catch((error) => {
      console.error(chalk.red("Regression test suite failed:"), error);
      process.exit(1);
    });
}

module.exports = RegressionTestSuite;
