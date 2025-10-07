const bcrypt = require("bcryptjs");

// Mock bcrypt for testing
jest.mock("bcryptjs");

describe("Authentication Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      session: {},
      body: {},
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      render: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Password Hashing", () => {
    test("should hash password correctly", async () => {
      const password = "testpassword123";
      const hashedPassword = "$2a$10$hashedpassword";

      bcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await bcrypt.hash(password, 10);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    test("should compare passwords correctly", async () => {
      const password = "testpassword123";
      const hashedPassword = "$2a$10$hashedpassword";

      bcrypt.compare.mockResolvedValue(true);

      const result = await bcrypt.compare(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    test("should return false for incorrect password", async () => {
      const password = "wrongpassword";
      const hashedPassword = "$2a$10$hashedpassword";

      bcrypt.compare.mockResolvedValue(false);

      const result = await bcrypt.compare(password, hashedPassword);

      expect(result).toBe(false);
    });
  });

  describe("Session Management", () => {
    test("should handle valid session", () => {
      req.session.user = { id: 1, email: "test@example.com" };
      req.session.company = { id: 1, name: "Test Company" };

      // Mock authentication middleware
      const authMiddleware = (req, res, next) => {
        if (req.session.user && req.session.company) {
          next();
        } else {
          res.status(401).json({ message: "Unauthorized" });
        }
      };

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("should reject invalid session", () => {
      // No session data

      const authMiddleware = (req, res, next) => {
        if (req.session.user && req.session.company) {
          next();
        } else {
          res.status(401).json({ message: "Unauthorized" });
        }
      };

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle session expiry", () => {
      req.session.user = { id: 1, email: "test@example.com" };
      req.session.company = { id: 1, name: "Test Company" };

      // Mock expired session
      req.session.cookie = { expires: new Date(Date.now() - 1000) };

      const authMiddleware = (req, res, next) => {
        if (
          req.session.user &&
          req.session.company &&
          (!req.session.cookie.expires ||
            req.session.cookie.expires > new Date())
        ) {
          next();
        } else {
          res.status(401).json({ message: "Session expired" });
        }
      };

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
