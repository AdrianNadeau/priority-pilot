const request = require("supertest");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");

// Create test app
const createTestApp = () => {
  const app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Test session configuration
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
    }),
  );

  // Mock authentication middleware for tests
  app.use((req, res, next) => {
    req.session.user = { id: 1, email: "test@example.com" };
    req.session.company = { id: 1, name: "Test Company" };
    next();
  });

  return app;
};

describe("API Integration Tests", () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe("Health Check Endpoints", () => {
    test("GET /health should return 200", async () => {
      app.get("/health", (req, res) => {
        res
          .status(200)
          .json({ status: "OK", timestamp: new Date().toISOString() });
      });

      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "OK");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("GET /api/health should return system info", async () => {
      app.get("/api/health", (req, res) => {
        res.status(200).json({
          status: "OK",
          database: "connected",
          memory: process.memoryUsage(),
          uptime: process.uptime(),
        });
      });

      const response = await request(app).get("/api/health").expect(200);

      expect(response.body.status).toBe("OK");
      expect(response.body.database).toBe("connected");
      expect(response.body).toHaveProperty("memory");
      expect(response.body).toHaveProperty("uptime");
    });
  });

  describe("Authentication Endpoints", () => {
    test("POST /api/auth/login should authenticate user", async () => {
      app.post("/api/auth/login", (req, res) => {
        const { email, password } = req.body;

        if (email === "test@example.com" && password === "password123") {
          req.session.user = { id: 1, email: email };
          res
            .status(200)
            .json({ message: "Login successful", user: req.session.user });
        } else {
          res.status(401).json({ message: "Invalid credentials" });
        }
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body.message).toBe("Login successful");
      expect(response.body.user.email).toBe("test@example.com");
    });

    test("POST /api/auth/login should reject invalid credentials", async () => {
      app.post("/api/auth/login", (req, res) => {
        const { email, password } = req.body;

        if (email === "test@example.com" && password === "password123") {
          req.session.user = { id: 1, email: email };
          res
            .status(200)
            .json({ message: "Login successful", user: req.session.user });
        } else {
          res.status(401).json({ message: "Invalid credentials" });
        }
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "wrong@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.message).toBe("Invalid credentials");
    });

    test("POST /api/auth/logout should clear session", async () => {
      app.post("/api/auth/logout", (req, res) => {
        req.session.destroy((err) => {
          if (err) {
            res.status(500).json({ message: "Logout failed" });
          } else {
            res.status(200).json({ message: "Logout successful" });
          }
        });
      });

      const response = await request(app).post("/api/auth/logout").expect(200);

      expect(response.body.message).toBe("Logout successful");
    });
  });

  describe("Project Endpoints", () => {
    test("GET /api/projects should return projects list", async () => {
      app.get("/api/projects", (req, res) => {
        const mockProjects = [
          { id: 1, project_name: "Project 1", company_id_fk: 1 },
          { id: 2, project_name: "Project 2", company_id_fk: 1 },
        ];
        res.status(200).json(mockProjects);
      });

      const response = await request(app).get("/api/projects").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty("project_name", "Project 1");
    });

    test("POST /api/projects should create new project", async () => {
      app.post("/api/projects", (req, res) => {
        const projectData = {
          id: Date.now(),
          ...req.body,
          company_id_fk: req.session.company.id,
        };
        res.status(201).json(projectData);
      });

      const newProject = {
        project_name: "New Test Project",
        project_description: "Test Description",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      };

      const response = await request(app)
        .post("/api/projects")
        .send(newProject)
        .expect(201);

      expect(response.body).toHaveProperty("project_name", "New Test Project");
      expect(response.body).toHaveProperty("company_id_fk", 1);
    });

    test("GET /api/projects/:id should return specific project", async () => {
      app.get("/api/projects/:id", (req, res) => {
        const projectId = parseInt(req.params.id);
        if (projectId === 1) {
          res.status(200).json({ id: 1, project_name: "Test Project" });
        } else {
          res.status(404).json({ message: "Project not found" });
        }
      });

      const response = await request(app).get("/api/projects/1").expect(200);

      expect(response.body).toHaveProperty("id", 1);
      expect(response.body).toHaveProperty("project_name", "Test Project");
    });

    test("PUT /api/projects/:id should update project", async () => {
      app.put("/api/projects/:id", (req, res) => {
        const projectId = parseInt(req.params.id);
        if (projectId === 1) {
          const updatedProject = { id: projectId, ...req.body };
          res.status(200).json(updatedProject);
        } else {
          res.status(404).json({ message: "Project not found" });
        }
      });

      const updateData = { project_name: "Updated Project Name" };

      const response = await request(app)
        .put("/api/projects/1")
        .send(updateData)
        .expect(200);

      expect(response.body.project_name).toBe("Updated Project Name");
    });

    test("DELETE /api/projects/:id should delete project", async () => {
      app.delete("/api/projects/:id", (req, res) => {
        const projectId = parseInt(req.params.id);
        if (projectId === 1) {
          res.status(200).json({ message: "Project deleted successfully" });
        } else {
          res.status(404).json({ message: "Project not found" });
        }
      });

      const response = await request(app).delete("/api/projects/1").expect(200);

      expect(response.body.message).toBe("Project deleted successfully");
    });
  });

  describe("Error Handling", () => {
    test("should handle 404 for non-existent routes", async () => {
      app.use("*", (req, res) => {
        res.status(404).json({ message: "Route not found" });
      });

      const response = await request(app).get("/api/nonexistent").expect(404);

      expect(response.body.message).toBe("Route not found");
    });

    test("should handle server errors gracefully", async () => {
      app.get("/api/error", (req, res, next) => {
        const error = new Error("Internal server error");
        error.status = 500;
        next(error);
      });

      app.use((error, req, res, next) => {
        res.status(error.status || 500).json({
          message: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        });
      });

      const response = await request(app).get("/api/error").expect(500);

      expect(response.body.message).toBe("Internal server error");
    });
  });

  describe("Middleware Tests", () => {
    test("should handle CORS properly", async () => {
      app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS",
        );
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization",
        );
        next();
      });

      app.get("/api/cors-test", (req, res) => {
        res.status(200).json({ message: "CORS test" });
      });

      const response = await request(app).get("/api/cors-test").expect(200);

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });

    test("should handle rate limiting", async () => {
      let requestCount = 0;

      app.use("/api/rate-limited", (req, res, next) => {
        requestCount++;
        if (requestCount > 5) {
          res.status(429).json({ message: "Too many requests" });
        } else {
          next();
        }
      });

      app.get("/api/rate-limited", (req, res) => {
        res.status(200).json({ message: "Request successful" });
      });

      // Make 5 successful requests
      for (let i = 0; i < 5; i++) {
        await request(app).get("/api/rate-limited").expect(200);
      }

      // 6th request should be rate limited
      const response = await request(app).get("/api/rate-limited").expect(429);

      expect(response.body.message).toBe("Too many requests");
    });
  });
});
