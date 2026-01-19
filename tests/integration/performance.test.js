const request = require("supertest");
const express = require("express");

describe("Performance Tests", () => {
  let app;

  beforeAll(() => {
    // Create test app
    app = express();
    app.use(express.json());

    // Mock endpoints for performance testing
    app.get("/health", (req, res) => {
      res
        .status(200)
        .json({ status: "OK", timestamp: new Date().toISOString() });
    });

    app.get("/api/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        database: "connected",
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      });
    });

    app.get("/api/projects", (req, res) => {
      // Simulate database query delay
      setTimeout(() => {
        const projects = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `Project ${i + 1}`,
          description: `Description for project ${i + 1}`,
        }));
        res.status(200).json(projects);
      }, 50);
    });

    app.get("/api/slow-endpoint", (req, res) => {
      // Simulate slow endpoint
      setTimeout(() => {
        res.status(200).json({ message: "Slow response" });
      }, 3000);
    });
  });

  describe("Response Time Performance", () => {
    test("health endpoint should respond quickly", async () => {
      const startTime = Date.now();

      const response = await request(app).get("/health").expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(100); // Should respond in less than 100ms
      expect(response.body.status).toBe("OK");
    });

    test("API health endpoint should respond within threshold", async () => {
      const startTime = Date.now();

      const response = await request(app).get("/api/health").expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(500); // Should respond in less than 500ms
      expect(response.body.status).toBe("OK");
    });

    test("projects endpoint should respond within reasonable time", async () => {
      const startTime = Date.now();

      const response = await request(app).get("/api/projects").expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(1000); // Should respond in less than 1 second
      expect(Array.isArray(response.body)).toBe(true);
    });

    test("should handle slow endpoints gracefully", async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get("/api/slow-endpoint")
        .timeout(5000) // 5 second timeout
        .expect(200);

      const responseTime = Date.now() - startTime;

      // This endpoint is intentionally slow but should still complete
      expect(responseTime).toBeGreaterThan(2900);
      expect(responseTime).toBeLessThan(4000);
    });
  });

  describe("Concurrent Request Handling", () => {
    test("should handle multiple concurrent requests", async () => {
      const concurrentRequests = 10;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(request(app).get("/health").expect(200));
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All requests should complete successfully
      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach((response) => {
        expect(response.body.status).toBe("OK");
      });

      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    test("should maintain performance under load", async () => {
      const loadRequests = 50;
      const batchSize = 10;
      const batches = [];

      // Create batches of requests
      for (let i = 0; i < loadRequests; i += batchSize) {
        const batch = [];
        for (let j = 0; j < batchSize && i + j < loadRequests; j++) {
          batch.push(request(app).get("/api/projects").expect(200));
        }
        batches.push(batch);
      }

      const startTime = Date.now();

      // Execute batches sequentially to simulate realistic load
      for (const batch of batches) {
        await Promise.all(batch);
      }

      const totalTime = Date.now() - startTime;

      // Should handle load efficiently
      expect(totalTime).toBeLessThan(10000); // Should complete in less than 10 seconds
    });
  });

  describe("Memory Usage", () => {
    test("should not have memory leaks during repeated requests", async () => {
      const iterations = 100;
      const initialMemory = process.memoryUsage().heapUsed;

      // Make repeated requests
      for (let i = 0; i < iterations; i++) {
        await request(app).get("/health").expect(200);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncreaseMB).toBeLessThan(10);
    });

    test("should monitor memory usage during load", async () => {
      const beforeMemory = process.memoryUsage();

      // Simulate load
      const requests = Array.from({ length: 20 }, () =>
        request(app).get("/api/projects").expect(200),
      );

      await Promise.all(requests);

      const afterMemory = process.memoryUsage();
      const memoryDifference = afterMemory.heapUsed - beforeMemory.heapUsed;
      const memoryDifferenceMB = memoryDifference / 1024 / 1024;

      // Memory usage should be reasonable
      expect(memoryDifferenceMB).toBeLessThan(50); // Less than 50MB increase
    });
  });

  describe("Error Rate Monitoring", () => {
    test("should maintain low error rate under normal conditions", async () => {
      const totalRequests = 100;
      const requests = [];

      for (let i = 0; i < totalRequests; i++) {
        requests.push(
          request(app)
            .get("/health")
            .then((res) => ({ success: res.status === 200 }))
            .catch(() => ({ success: false })),
        );
      }

      const results = await Promise.all(requests);
      const successCount = results.filter((r) => r.success).length;
      const errorRate = (totalRequests - successCount) / totalRequests;

      // Error rate should be very low (less than 1%)
      expect(errorRate).toBeLessThan(0.01);
    });

    test("should handle invalid requests gracefully", async () => {
      const invalidRequests = [
        request(app).get("/nonexistent").expect(404),
        request(app).post("/health").expect(404),
        request(app).get("/api/invalid").expect(404),
      ];

      const startTime = Date.now();
      const responses = await Promise.allSettled(invalidRequests);
      const responseTime = Date.now() - startTime;

      // Should handle invalid requests quickly
      expect(responseTime).toBeLessThan(1000);

      // All requests should be handled (not crashed)
      responses.forEach((result) => {
        expect(result.status).toBe("fulfilled");
      });
    });
  });

  describe("Throughput Testing", () => {
    test("should achieve minimum throughput requirements", async () => {
      const duration = 5000; // 5 seconds
      const startTime = Date.now();
      let requestCount = 0;

      // Make requests continuously for the duration
      while (Date.now() - startTime < duration) {
        await request(app).get("/health").expect(200);
        requestCount++;
      }

      const actualDuration = Date.now() - startTime;
      const throughput = (requestCount / actualDuration) * 1000; // requests per second

      // Should achieve at least 50 requests per second
      expect(throughput).toBeGreaterThan(50);
    });

    test("should scale with concurrent users", async () => {
      const concurrentUsers = 5;
      const requestsPerUser = 10;
      const userPromises = [];

      for (let user = 0; user < concurrentUsers; user++) {
        const userRequests = async () => {
          const requests = [];
          for (let req = 0; req < requestsPerUser; req++) {
            requests.push(request(app).get("/health").expect(200));
          }
          return Promise.all(requests);
        };
        userPromises.push(userRequests());
      }

      const startTime = Date.now();
      await Promise.all(userPromises);
      const totalTime = Date.now() - startTime;

      const totalRequests = concurrentUsers * requestsPerUser;
      const throughput = (totalRequests / totalTime) * 1000;

      // Should maintain reasonable throughput with concurrent users
      expect(throughput).toBeGreaterThan(20);
    });
  });

  describe("Database Performance", () => {
    test("should handle database queries efficiently", async () => {
      // Simulate database query time
      const startTime = Date.now();

      const response = await request(app).get("/api/projects").expect(200);

      const queryTime = Date.now() - startTime;

      // Database queries should be reasonably fast
      expect(queryTime).toBeLessThan(200);
      expect(response.body).toHaveLength(100);
    });

    test("should handle multiple database queries concurrently", async () => {
      const concurrentQueries = 5;
      const queries = [];

      for (let i = 0; i < concurrentQueries; i++) {
        queries.push(request(app).get("/api/projects").expect(200));
      }

      const startTime = Date.now();
      const responses = await Promise.all(queries);
      const totalTime = Date.now() - startTime;

      // Should handle concurrent queries efficiently
      expect(totalTime).toBeLessThan(1000);
      responses.forEach((response) => {
        expect(response.body).toHaveLength(100);
      });
    });
  });
});
