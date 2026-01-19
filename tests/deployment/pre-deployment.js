#!/usr/bin/env node

const axios = require("axios");
const chalk = require("chalk");

class PreDeploymentValidator {
  constructor(config = {}) {
    this.baseUrl =
      config.baseUrl || process.env.BASE_URL || "http://localhost:3000";
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    this.tests = [];
    this.results = [];
  }

  // Add test case
  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  // Execute all tests
  async runTests() {
    console.log(
      chalk.blue(`🚀 Starting pre-deployment validation for ${this.baseUrl}`),
    );
    console.log(
      chalk.gray(`Timeout: ${this.timeout}ms, Retries: ${this.retries}\n`),
    );

    for (const test of this.tests) {
      await this.runSingleTest(test);
    }

    this.printSummary();
    return this.results.every((result) => result.passed);
  }

  // Run a single test with retries
  async runSingleTest(test) {
    let lastError;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const startTime = Date.now();
        await test.testFn();
        const duration = Date.now() - startTime;

        this.results.push({
          name: test.name,
          passed: true,
          duration,
          attempt,
        });

        console.log(chalk.green(`✓ ${test.name} (${duration}ms)`));
        return;
      } catch (error) {
        lastError = error;

        if (attempt < this.retries) {
          console.log(
            chalk.yellow(
              `⚠ ${test.name} failed on attempt ${attempt}, retrying...`,
            ),
          );
          await this.sleep(1000 * attempt); // Exponential backoff
        }
      }
    }

    this.results.push({
      name: test.name,
      passed: false,
      error: lastError.message,
      attempts: this.retries,
    });

    console.log(chalk.red(`✗ ${test.name} - ${lastError.message}`));
  }

  // Helper method for delays
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Print test summary
  printSummary() {
    const passed = this.results.filter((r) => r.passed).length;
    const total = this.results.length;

    console.log("\n" + chalk.bold("Test Summary:"));
    console.log(`${chalk.green("Passed:")} ${passed}/${total}`);

    if (passed === total) {
      console.log(chalk.green("\n🎉 All pre-deployment tests passed!"));
    } else {
      console.log(
        chalk.red("\n❌ Some tests failed. Deployment should be reviewed."),
      );

      // Show failed tests
      const failed = this.results.filter((r) => !r.passed);
      console.log("\nFailed tests:");
      failed.forEach((test) => {
        console.log(chalk.red(`  - ${test.name}: ${test.error}`));
      });
    }
  }
}

// Create validator instance
const validator = new PreDeploymentValidator();

// Define pre-deployment tests
validator.addTest("Application Health Check", async () => {
  const response = await axios.get(`${validator.baseUrl}/health`, {
    timeout: validator.timeout,
  });

  if (response.status !== 200) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  if (response.data.status !== "OK") {
    throw new Error(`Health check returned status: ${response.data.status}`);
  }
});

validator.addTest("Database Connectivity", async () => {
  const response = await axios.get(`${validator.baseUrl}/api/health`, {
    timeout: validator.timeout,
  });

  if (response.data.database !== "connected") {
    throw new Error(`Database not connected: ${response.data.database}`);
  }
});

validator.addTest("Authentication Endpoint", async () => {
  const response = await axios.post(
    `${validator.baseUrl}/api/auth/login`,
    {
      email: "test@example.com",
      password: "wrongpassword",
    },
    {
      timeout: validator.timeout,
      validateStatus: () => true, // Don't throw on 4xx/5xx
    },
  );

  if (response.status !== 401) {
    throw new Error(`Login endpoint not working correctly: ${response.status}`);
  }
});

validator.addTest("API Routes Accessibility", async () => {
  const routes = ["/api/projects", "/api/dashboard", "/api/users"];

  for (const route of routes) {
    const response = await axios.get(`${validator.baseUrl}${route}`, {
      timeout: validator.timeout,
      validateStatus: () => true,
    });

    // Should return 401 (unauthorized) for protected routes, not 404 or 500
    if (![200, 401, 403].includes(response.status)) {
      throw new Error(
        `Route ${route} returned unexpected status: ${response.status}`,
      );
    }
  }
});

validator.addTest("Static Assets Loading", async () => {
  const assets = ["/public/assets/css/style.css", "/public/assets/js/theme.js"];

  for (const asset of assets) {
    const response = await axios.get(`${validator.baseUrl}${asset}`, {
      timeout: validator.timeout,
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      throw new Error(`Asset ${asset} failed to load: ${response.status}`);
    }
  }
});

validator.addTest("Memory Usage Check", async () => {
  const response = await axios.get(`${validator.baseUrl}/api/health`, {
    timeout: validator.timeout,
  });

  if (response.data.memory) {
    const memoryMB = response.data.memory.heapUsed / 1024 / 1024;
    if (memoryMB > 500) {
      // Alert if using more than 500MB
      console.log(
        chalk.yellow(`Warning: High memory usage: ${memoryMB.toFixed(2)}MB`),
      );
    }
  }
});

validator.addTest("Response Time Check", async () => {
  const startTime = Date.now();
  const response = await axios.get(`${validator.baseUrl}/api/projects`, {
    timeout: validator.timeout,
    validateStatus: () => true,
  });
  const responseTime = Date.now() - startTime;

  if (responseTime > 5000) {
    // Alert if response time > 5 seconds
    throw new Error(`Slow response time: ${responseTime}ms`);
  }
});

// Run the validation
if (require.main === module) {
  validator
    .runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(chalk.red("Validation failed:"), error);
      process.exit(1);
    });
}

module.exports = PreDeploymentValidator;
