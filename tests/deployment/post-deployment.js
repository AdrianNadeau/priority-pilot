#!/usr/bin/env node

const axios = require("axios");
const chalk = require("chalk");

class PostDeploymentValidator {
  constructor(config = {}) {
    this.baseUrl =
      config.baseUrl || process.env.BASE_URL || "http://localhost:3000";
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    this.warmupTime = config.warmupTime || 10000; // Wait for app to warm up
    this.tests = [];
    this.results = [];
  }

  // Add test case
  addTest(name, testFn, critical = false) {
    this.tests.push({ name, testFn, critical });
  }

  // Execute all tests
  async runTests() {
    console.log(
      chalk.blue(`🔍 Starting post-deployment validation for ${this.baseUrl}`),
    );
    console.log(
      chalk.gray(
        `Warmup time: ${this.warmupTime}ms, Timeout: ${this.timeout}ms\n`,
      ),
    );

    // Wait for application to warm up
    console.log(chalk.yellow("Waiting for application warmup..."));
    await this.sleep(this.warmupTime);

    for (const test of this.tests) {
      await this.runSingleTest(test);
    }

    return this.generateReport();
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
          critical: test.critical,
        });

        console.log(
          chalk.green(
            `✓ ${test.name} (${duration}ms)${test.critical ? " [CRITICAL]" : ""}`,
          ),
        );
        return;
      } catch (error) {
        lastError = error;

        if (attempt < this.retries) {
          console.log(
            chalk.yellow(
              `⚠ ${test.name} failed on attempt ${attempt}, retrying...`,
            ),
          );
          await this.sleep(2000 * attempt); // Exponential backoff
        }
      }
    }

    this.results.push({
      name: test.name,
      passed: false,
      error: lastError.message,
      attempts: this.retries,
      critical: test.critical,
    });

    const marker = test.critical ? "🚨" : "✗";
    console.log(
      chalk.red(
        `${marker} ${test.name} - ${lastError.message}${test.critical ? " [CRITICAL]" : ""}`,
      ),
    );
  }

  // Helper method for delays
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Generate comprehensive report
  generateReport() {
    const passed = this.results.filter((r) => r.passed).length;
    const total = this.results.length;
    const failed = this.results.filter((r) => !r.passed);
    const criticalFailed = failed.filter((r) => r.critical);

    console.log("\n" + chalk.bold("Post-Deployment Validation Report:"));
    console.log("═".repeat(50));

    // Overall status
    if (criticalFailed.length > 0) {
      console.log(chalk.red.bold("🚨 CRITICAL FAILURES DETECTED"));
      console.log(chalk.red("Deployment should be rolled back immediately!\n"));
    } else if (failed.length > 0) {
      console.log(chalk.yellow.bold("⚠ NON-CRITICAL FAILURES DETECTED"));
      console.log(
        chalk.yellow("Deployment succeeded but requires attention\n"),
      );
    } else {
      console.log(chalk.green.bold("🎉 DEPLOYMENT SUCCESSFUL"));
      console.log(chalk.green("All tests passed!\n"));
    }

    // Statistics
    console.log(`${chalk.green("Passed:")} ${passed}/${total}`);
    console.log(`${chalk.red("Failed:")} ${failed.length}/${total}`);
    console.log(
      `${chalk.red("Critical Failed:")} ${criticalFailed.length}/${total}\n`,
    );

    // Performance metrics
    const avgDuration =
      this.results
        .filter((r) => r.passed)
        .reduce((sum, r) => sum + r.duration, 0) / passed || 0;

    console.log(`Average response time: ${avgDuration.toFixed(2)}ms`);

    // Failed tests details
    if (failed.length > 0) {
      console.log("\n" + chalk.bold("Failed Tests:"));
      failed.forEach((test) => {
        const prefix = test.critical ? "🚨" : "  -";
        console.log(chalk.red(`${prefix} ${test.name}: ${test.error}`));
      });
    }

    // Recommendations
    this.printRecommendations(criticalFailed, failed);

    return {
      success: criticalFailed.length === 0,
      critical: criticalFailed.length === 0,
      passed,
      total,
      failed: failed.length,
      criticalFailed: criticalFailed.length,
      averageResponseTime: avgDuration,
    };
  }

  // Print recommendations based on test results
  printRecommendations(criticalFailed, failed) {
    console.log("\n" + chalk.bold("Recommendations:"));

    if (criticalFailed.length > 0) {
      console.log(chalk.red("🚨 IMMEDIATE ACTIONS REQUIRED:"));
      console.log(chalk.red("- Roll back deployment immediately"));
      console.log(chalk.red("- Investigate critical failures"));
      console.log(chalk.red("- Fix issues before retry"));
    } else if (failed.length > 0) {
      console.log(chalk.yellow("⚠ FOLLOW-UP ACTIONS:"));
      console.log(chalk.yellow("- Monitor application closely"));
      console.log(chalk.yellow("- Address non-critical issues"));
      console.log(chalk.yellow("- Schedule fixes for next deployment"));
    } else {
      console.log(chalk.green("✅ MONITORING ACTIONS:"));
      console.log(chalk.green("- Continue monitoring application health"));
      console.log(chalk.green("- Verify user acceptance"));
      console.log(chalk.green("- Update documentation if needed"));
    }
  }
}

// Create validator instance
const validator = new PostDeploymentValidator();

// Define post-deployment tests
validator.addTest(
  "Application Availability",
  async () => {
    const response = await axios.get(`${validator.baseUrl}/health`, {
      timeout: validator.timeout,
    });

    if (response.status !== 200) {
      throw new Error(`Application not available: ${response.status}`);
    }
  },
  true,
); // Critical test

validator.addTest(
  "Database Connection Health",
  async () => {
    const response = await axios.get(`${validator.baseUrl}/api/health`, {
      timeout: validator.timeout,
    });

    if (response.data.database !== "connected") {
      throw new Error(`Database connection failed: ${response.data.database}`);
    }
  },
  true,
); // Critical test

validator.addTest(
  "Authentication System",
  async () => {
    // Test login endpoint
    const loginResponse = await axios.post(
      `${validator.baseUrl}/api/auth/login`,
      {
        email: "test@example.com",
        password: "wrongpassword",
      },
      {
        timeout: validator.timeout,
        validateStatus: () => true,
      },
    );

    if (loginResponse.status !== 401) {
      throw new Error(`Authentication not working: ${loginResponse.status}`);
    }
  },
  true,
); // Critical test

validator.addTest(
  "Core API Endpoints",
  async () => {
    const endpoints = [
      { path: "/api/projects", method: "GET" },
      { path: "/api/dashboard", method: "GET" },
      { path: "/api/users", method: "GET" },
    ];

    for (const endpoint of endpoints) {
      const response = await axios({
        method: endpoint.method,
        url: `${validator.baseUrl}${endpoint.path}`,
        timeout: validator.timeout,
        validateStatus: () => true,
      });

      // Should not return 500 errors or connection failures
      if (response.status >= 500) {
        throw new Error(
          `${endpoint.path} returned server error: ${response.status}`,
        );
      }
    }
  },
  true,
); // Critical test

validator.addTest("Session Management", async () => {
  const agent = axios.create({
    baseURL: validator.baseUrl,
    timeout: validator.timeout,
    withCredentials: true,
  });

  // Test session creation and persistence
  const sessionResponse = await agent.get("/api/session", {
    validateStatus: () => true,
  });

  if (sessionResponse.status >= 500) {
    throw new Error(`Session management error: ${sessionResponse.status}`);
  }
});

validator.addTest("Memory and Performance", async () => {
  const response = await axios.get(`${validator.baseUrl}/api/health`, {
    timeout: validator.timeout,
  });

  if (response.data.memory) {
    const memoryMB = response.data.memory.heapUsed / 1024 / 1024;
    if (memoryMB > 1000) {
      // Alert if using more than 1GB
      throw new Error(`High memory usage detected: ${memoryMB.toFixed(2)}MB`);
    }
  }
});

validator.addTest("Response Time Performance", async () => {
  const startTime = Date.now();
  await axios.get(`${validator.baseUrl}/api/projects`, {
    timeout: validator.timeout,
    validateStatus: () => true,
  });
  const responseTime = Date.now() - startTime;

  if (responseTime > 10000) {
    // Alert if response time > 10 seconds
    throw new Error(`Poor response time: ${responseTime}ms`);
  }
});

validator.addTest("Static Asset Delivery", async () => {
  const assets = [
    "/public/assets/css/style.css",
    "/public/assets/js/theme.js",
    "/favicon.ico",
  ];

  for (const asset of assets) {
    const response = await axios.get(`${validator.baseUrl}${asset}`, {
      timeout: validator.timeout,
      validateStatus: () => true,
    });

    if (![200, 304].includes(response.status)) {
      throw new Error(`Asset ${asset} not accessible: ${response.status}`);
    }
  }
});

validator.addTest("HTTPS and Security Headers", async () => {
  if (validator.baseUrl.startsWith("https://")) {
    const response = await axios.get(validator.baseUrl, {
      timeout: validator.timeout,
    });

    // Check for basic security headers
    const headers = response.headers;
    const securityHeaders = [
      "x-frame-options",
      "x-content-type-options",
      "x-xss-protection",
    ];

    for (const header of securityHeaders) {
      if (!headers[header]) {
        console.log(
          chalk.yellow(`Warning: Missing security header: ${header}`),
        );
      }
    }
  }
});

validator.addTest("Error Handling", async () => {
  // Test 404 handling
  const notFoundResponse = await axios.get(
    `${validator.baseUrl}/nonexistent-route`,
    {
      timeout: validator.timeout,
      validateStatus: () => true,
    },
  );

  if (notFoundResponse.status !== 404) {
    throw new Error(`404 handling not working: ${notFoundResponse.status}`);
  }
});

// Run the validation
if (require.main === module) {
  validator
    .runTests()
    .then((report) => {
      // Exit with appropriate code
      process.exit(report.critical ? 0 : 1);
    })
    .catch((error) => {
      console.error(chalk.red("Post-deployment validation failed:"), error);
      process.exit(1);
    });
}

module.exports = PostDeploymentValidator;
