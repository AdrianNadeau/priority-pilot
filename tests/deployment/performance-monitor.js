#!/usr/bin/env node

const axios = require("axios");
const chalk = require("chalk");

class PerformanceMonitor {
  constructor(config = {}) {
    this.baseUrl =
      config.baseUrl || process.env.BASE_URL || "http://localhost:3000";
    this.timeout = config.timeout || 30000;
    this.concurrency = config.concurrency || 10;
    this.duration = config.duration || 60000; // 1 minute
    this.thresholds = {
      responseTime: config.responseTimeThreshold || 2000, // 2 seconds
      errorRate: config.errorRateThreshold || 0.05, // 5%
      throughput: config.throughputThreshold || 10, // requests per second
    };
    this.metrics = {
      requests: 0,
      responses: 0,
      errors: 0,
      responseTimes: [],
      startTime: null,
      endTime: null,
    };
  }

  // Run performance test suite
  async runPerformanceTests() {
    console.log(
      chalk.blue(`🚀 Starting performance monitoring for ${this.baseUrl}`),
    );
    console.log(
      chalk.gray(
        `Concurrency: ${this.concurrency}, Duration: ${this.duration}ms\n`,
      ),
    );

    const results = {};

    // Test individual endpoints
    results.healthCheck = await this.testEndpoint("/health", "Health Check");
    results.apiHealth = await this.testEndpoint("/api/health", "API Health");
    results.authentication = await this.testAuthenticationPerformance();
    results.projectsAPI = await this.testEndpoint(
      "/api/projects",
      "Projects API",
      true,
    );
    results.dashboardAPI = await this.testEndpoint(
      "/api/dashboard",
      "Dashboard API",
      true,
    );

    // Load testing
    results.loadTest = await this.runLoadTest();

    // Memory usage test
    results.memoryUsage = await this.testMemoryUsage();

    // Generate comprehensive report
    return this.generatePerformanceReport(results);
  }

  // Test single endpoint performance
  async testEndpoint(path, name, requiresAuth = false) {
    console.log(chalk.cyan(`\n📊 Testing ${name}...`));

    const url = `${this.baseUrl}${path}`;
    const samples = 10;
    const responseTimes = [];
    let errors = 0;

    for (let i = 0; i < samples; i++) {
      try {
        const startTime = Date.now();

        const config = {
          timeout: this.timeout,
          validateStatus: () => true,
        };

        if (requiresAuth) {
          // For auth-required endpoints, expect 401 but measure response time
          config.validateStatus = (status) => status === 401 || status === 200;
        }

        const response = await axios.get(url, config);
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);

        if (requiresAuth && ![200, 401, 403].includes(response.status)) {
          errors++;
        } else if (!requiresAuth && response.status !== 200) {
          errors++;
        }
      } catch (error) {
        errors++;
        responseTimes.push(this.timeout); // Count timeouts as max response time
      }
    }

    const avgResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const errorRate = errors / samples;

    const result = {
      endpoint: path,
      samples,
      avgResponseTime: Math.round(avgResponseTime),
      minResponseTime,
      maxResponseTime,
      errorRate: Math.round(errorRate * 100),
      passed:
        avgResponseTime < this.thresholds.responseTime &&
        errorRate < this.thresholds.errorRate,
    };

    this.logEndpointResult(name, result);
    return result;
  }

  // Test authentication performance
  async testAuthenticationPerformance() {
    console.log(chalk.cyan("\n🔐 Testing Authentication Performance..."));

    const authUrl = `${this.baseUrl}/api/auth/login`;
    const samples = 5;
    const responseTimes = [];
    let errors = 0;

    for (let i = 0; i < samples; i++) {
      try {
        const startTime = Date.now();

        const response = await axios.post(
          authUrl,
          {
            email: "test@example.com",
            password: "wrongpassword",
          },
          {
            timeout: this.timeout,
            validateStatus: () => true,
          },
        );

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);

        // Expect 401 for wrong credentials
        if (response.status !== 401) {
          errors++;
        }
      } catch (error) {
        errors++;
        responseTimes.push(this.timeout);
      }
    }

    const avgResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const errorRate = errors / samples;

    const result = {
      endpoint: "/api/auth/login",
      samples,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100),
      passed:
        avgResponseTime < this.thresholds.responseTime &&
        errorRate < this.thresholds.errorRate,
    };

    this.logEndpointResult("Authentication", result);
    return result;
  }

  // Run load test with concurrent requests
  async runLoadTest() {
    console.log(chalk.cyan("\n⚡ Running Load Test..."));

    this.resetMetrics();
    const testUrl = `${this.baseUrl}/health`;
    const startTime = Date.now();
    const endTime = startTime + this.duration;

    // Start concurrent workers
    const workers = [];
    for (let i = 0; i < this.concurrency; i++) {
      workers.push(this.loadTestWorker(testUrl, endTime));
    }

    // Wait for all workers to complete
    await Promise.all(workers);

    const totalDuration = Date.now() - startTime;
    const throughput = (this.metrics.responses / totalDuration) * 1000; // requests per second
    const errorRate = this.metrics.errors / this.metrics.requests;
    const avgResponseTime =
      this.metrics.responseTimes.reduce((sum, time) => sum + time, 0) /
      this.metrics.responseTimes.length;

    const result = {
      duration: totalDuration,
      requests: this.metrics.requests,
      responses: this.metrics.responses,
      errors: this.metrics.errors,
      throughput: Math.round(throughput * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100),
      passed:
        throughput >= this.thresholds.throughput &&
        errorRate < this.thresholds.errorRate,
    };

    this.logLoadTestResult(result);
    return result;
  }

  // Load test worker
  async loadTestWorker(url, endTime) {
    while (Date.now() < endTime) {
      try {
        this.metrics.requests++;
        const startTime = Date.now();

        const response = await axios.get(url, {
          timeout: this.timeout,
          validateStatus: () => true,
        });

        const responseTime = Date.now() - startTime;
        this.metrics.responseTimes.push(responseTime);
        this.metrics.responses++;

        if (response.status !== 200) {
          this.metrics.errors++;
        }
      } catch (error) {
        this.metrics.errors++;
        this.metrics.responseTimes.push(this.timeout);
      }

      // Small delay to prevent overwhelming the server
      await this.sleep(10);
    }
  }

  // Test memory usage
  async testMemoryUsage() {
    console.log(chalk.cyan("\n🧠 Testing Memory Usage..."));

    try {
      const response = await axios.get(`${this.baseUrl}/api/health`, {
        timeout: this.timeout,
      });

      if (response.data.memory) {
        const memoryMB = response.data.memory.heapUsed / 1024 / 1024;
        const memoryUsedMB = response.data.memory.heapUsed / 1024 / 1024;
        const memoryTotalMB = response.data.memory.heapTotal / 1024 / 1024;
        const memoryUsagePercent = (memoryUsedMB / memoryTotalMB) * 100;

        const result = {
          heapUsedMB: Math.round(memoryUsedMB * 100) / 100,
          heapTotalMB: Math.round(memoryTotalMB * 100) / 100,
          usagePercent: Math.round(memoryUsagePercent * 100) / 100,
          passed: memoryUsedMB < 500, // Less than 500MB
        };

        this.logMemoryResult(result);
        return result;
      } else {
        return {
          error: "Memory information not available",
          passed: false,
        };
      }
    } catch (error) {
      return {
        error: error.message,
        passed: false,
      };
    }
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      requests: 0,
      responses: 0,
      errors: 0,
      responseTimes: [],
      startTime: Date.now(),
      endTime: null,
    };
  }

  // Log endpoint result
  logEndpointResult(name, result) {
    const status = result.passed ? chalk.green("✓ PASS") : chalk.red("✗ FAIL");
    console.log(`${status} ${name}:`);
    console.log(`  Average Response Time: ${result.avgResponseTime}ms`);
    console.log(`  Error Rate: ${result.errorRate}%`);

    if (!result.passed) {
      if (result.avgResponseTime >= this.thresholds.responseTime) {
        console.log(
          chalk.red(
            `  ⚠ Slow response time (threshold: ${this.thresholds.responseTime}ms)`,
          ),
        );
      }
      if (result.errorRate >= this.thresholds.errorRate * 100) {
        console.log(
          chalk.red(
            `  ⚠ High error rate (threshold: ${this.thresholds.errorRate * 100}%)`,
          ),
        );
      }
    }
  }

  // Log load test result
  logLoadTestResult(result) {
    const status = result.passed ? chalk.green("✓ PASS") : chalk.red("✗ FAIL");
    console.log(`${status} Load Test:`);
    console.log(`  Duration: ${result.duration}ms`);
    console.log(`  Requests: ${result.requests}`);
    console.log(`  Responses: ${result.responses}`);
    console.log(`  Errors: ${result.errors}`);
    console.log(`  Throughput: ${result.throughput} req/s`);
    console.log(`  Average Response Time: ${result.avgResponseTime}ms`);
    console.log(`  Error Rate: ${result.errorRate}%`);

    if (!result.passed) {
      if (result.throughput < this.thresholds.throughput) {
        console.log(
          chalk.red(
            `  ⚠ Low throughput (threshold: ${this.thresholds.throughput} req/s)`,
          ),
        );
      }
      if (result.errorRate >= this.thresholds.errorRate * 100) {
        console.log(
          chalk.red(
            `  ⚠ High error rate (threshold: ${this.thresholds.errorRate * 100}%)`,
          ),
        );
      }
    }
  }

  // Log memory result
  logMemoryResult(result) {
    if (result.error) {
      console.log(chalk.red(`✗ Memory Test: ${result.error}`));
      return;
    }

    const status = result.passed ? chalk.green("✓ PASS") : chalk.red("✗ FAIL");
    console.log(`${status} Memory Usage:`);
    console.log(`  Heap Used: ${result.heapUsedMB}MB`);
    console.log(`  Heap Total: ${result.heapTotalMB}MB`);
    console.log(`  Usage: ${result.usagePercent}%`);

    if (!result.passed) {
      console.log(chalk.red(`  ⚠ High memory usage (threshold: 500MB)`));
    }
  }

  // Generate comprehensive performance report
  generatePerformanceReport(results) {
    const allTests = Object.values(results).filter(
      (r) => r.passed !== undefined,
    );
    const passedTests = allTests.filter((r) => r.passed);
    const failedTests = allTests.filter((r) => !r.passed);

    console.log("\n" + chalk.bold("Performance Test Report"));
    console.log("═".repeat(50));

    // Overall status
    if (failedTests.length === 0) {
      console.log(chalk.green.bold("🎉 ALL PERFORMANCE TESTS PASSED"));
      console.log(
        chalk.green("Application performance is within acceptable limits\n"),
      );
    } else {
      console.log(chalk.red.bold("⚠ PERFORMANCE ISSUES DETECTED"));
      console.log(chalk.red(`${failedTests.length} test(s) failed\n`));
    }

    // Statistics
    console.log(
      `${chalk.green("Passed:")} ${passedTests.length}/${allTests.length}`,
    );
    console.log(
      `${chalk.red("Failed:")} ${failedTests.length}/${allTests.length}\n`,
    );

    // Performance metrics summary
    if (results.loadTest) {
      console.log(chalk.bold("Load Test Summary:"));
      console.log(`  Throughput: ${results.loadTest.throughput} req/s`);
      console.log(
        `  Average Response Time: ${results.loadTest.avgResponseTime}ms`,
      );
      console.log(`  Error Rate: ${results.loadTest.errorRate}%\n`);
    }

    // Failed tests details
    if (failedTests.length > 0) {
      console.log(chalk.bold("Failed Tests:"));
      failedTests.forEach((test) => {
        console.log(
          chalk.red(
            `  - ${test.endpoint || "Load Test"}: Performance threshold exceeded`,
          ),
        );
      });
    }

    // Recommendations
    this.printPerformanceRecommendations(failedTests, results);

    return {
      success: failedTests.length === 0,
      totalTests: allTests.length,
      passedTests: passedTests.length,
      failedTests: failedTests.length,
      results,
    };
  }

  // Print performance recommendations
  printPerformanceRecommendations(failedTests, results) {
    console.log("\n" + chalk.bold("Performance Recommendations:"));

    if (failedTests.length === 0) {
      console.log(chalk.green("✅ Performance is good. Continue monitoring:"));
      console.log(chalk.green("- Set up continuous performance monitoring"));
      console.log(chalk.green("- Monitor performance trends over time"));
      console.log(chalk.green("- Consider performance budgets for CI/CD"));
    } else {
      console.log(chalk.yellow("⚠ Performance improvements needed:"));

      failedTests.forEach((test) => {
        if (
          test.avgResponseTime &&
          test.avgResponseTime >= this.thresholds.responseTime
        ) {
          console.log(
            chalk.yellow(
              "- Optimize slow endpoints (caching, indexing, query optimization)",
            ),
          );
        }
        if (
          test.errorRate &&
          test.errorRate >= this.thresholds.errorRate * 100
        ) {
          console.log(chalk.yellow("- Investigate and fix error sources"));
        }
        if (test.throughput && test.throughput < this.thresholds.throughput) {
          console.log(
            chalk.yellow("- Scale application resources (CPU, memory)"),
          );
          console.log(
            chalk.yellow("- Optimize database connections and queries"),
          );
        }
      });

      if (results.memoryUsage && !results.memoryUsage.passed) {
        console.log(
          chalk.yellow("- Investigate memory leaks and optimize memory usage"),
        );
      }
    }
  }

  // Helper method for delays
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Run performance monitoring
if (require.main === module) {
  const monitor = new PerformanceMonitor({
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
    concurrency: parseInt(process.env.CONCURRENCY) || 10,
    duration: parseInt(process.env.DURATION) || 60000,
    responseTimeThreshold:
      parseInt(process.env.RESPONSE_TIME_THRESHOLD) || 2000,
    errorRateThreshold: parseFloat(process.env.ERROR_RATE_THRESHOLD) || 0.05,
    throughputThreshold: parseInt(process.env.THROUGHPUT_THRESHOLD) || 10,
  });

  monitor
    .runPerformanceTests()
    .then((report) => {
      process.exit(report.success ? 0 : 1);
    })
    .catch((error) => {
      console.error(chalk.red("Performance monitoring failed:"), error);
      process.exit(1);
    });
}

module.exports = PerformanceMonitor;
