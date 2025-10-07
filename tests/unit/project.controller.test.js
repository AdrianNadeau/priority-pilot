const request = require("supertest");
const express = require("express");

// Mock the database models
jest.mock("../../models", () => ({
  projects: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  phases: {
    findAll: jest.fn(),
  },
  priorities: {
    findAll: jest.fn(),
  },
  persons: {
    findAll: jest.fn(),
  },
  statuses: {
    findAll: jest.fn(),
  },
  tags: {
    findAll: jest.fn(),
  },
  Sequelize: {
    Op: {
      like: Symbol("like"),
      iLike: Symbol("iLike"),
      in: Symbol("in"),
    },
  },
}));

const projectController = require("../../controllers/project.controller");
const db = require("../../models");

describe("Project Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      session: {
        company: { id: 1 },
        user: { id: 1 },
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      render: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    test("should create a new project successfully", async () => {
      const projectData = {
        project_name: "Test Project",
        project_description: "Test Description",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        phase_id_fk: 1,
        priority_id_fk: 1,
        person_id_fk: 1,
        status_id_fk: 1,
      };

      req.body = projectData;

      const mockProject = { id: 1, ...projectData };
      db.projects.create.mockResolvedValue(mockProject);

      await projectController.create(req, res);

      expect(db.projects.create).toHaveBeenCalledWith({
        ...projectData,
        company_id_fk: 1,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should handle validation errors", async () => {
      req.body = {
        project_name: "", // Empty name should cause validation error
      };

      db.projects.create.mockRejectedValue(new Error("Validation error"));

      await projectController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test("should handle database errors", async () => {
      req.body = {
        project_name: "Test Project",
        project_description: "Test Description",
      };

      db.projects.create.mockRejectedValue(
        new Error("Database connection error"),
      );

      await projectController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("findAll", () => {
    test("should retrieve all projects for company", async () => {
      const mockProjects = [
        { id: 1, project_name: "Project 1", company_id_fk: 1 },
        { id: 2, project_name: "Project 2", company_id_fk: 1 },
      ];

      db.projects.findAll.mockResolvedValue(mockProjects);

      await projectController.findAll(req, res);

      expect(db.projects.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should handle empty results", async () => {
      db.projects.findAll.mockResolvedValue([]);

      await projectController.findAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should handle database errors", async () => {
      db.projects.findAll.mockRejectedValue(new Error("Database error"));

      await projectController.findAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("findOne", () => {
    test("should retrieve a single project by ID", async () => {
      const mockProject = { id: 1, project_name: "Test Project" };
      req.params.id = "1";

      db.projects.findByPk.mockResolvedValue(mockProject);

      await projectController.findOne(req, res);

      expect(db.projects.findByPk).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should handle project not found", async () => {
      req.params.id = "999";
      db.projects.findByPk.mockResolvedValue(null);

      await projectController.findOne(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("update", () => {
    test("should update project successfully", async () => {
      const updateData = { project_name: "Updated Project" };
      req.params.id = "1";
      req.body = updateData;

      const mockProject = {
        id: 1,
        update: jest.fn().mockResolvedValue([1]),
      };
      db.projects.findByPk.mockResolvedValue(mockProject);

      await projectController.update(req, res);

      expect(mockProject.update).toHaveBeenCalledWith(updateData);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should handle project not found for update", async () => {
      req.params.id = "999";
      req.body = { project_name: "Updated Project" };

      db.projects.findByPk.mockResolvedValue(null);

      await projectController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("delete", () => {
    test("should delete project successfully", async () => {
      req.params.id = "1";

      const mockProject = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(1),
      };
      db.projects.findByPk.mockResolvedValue(mockProject);

      await projectController.delete(req, res);

      expect(mockProject.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should handle project not found for deletion", async () => {
      req.params.id = "999";
      db.projects.findByPk.mockResolvedValue(null);

      await projectController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
