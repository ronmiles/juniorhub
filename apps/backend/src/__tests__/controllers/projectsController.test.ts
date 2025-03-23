import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  getProjects,
  getProjectById,
  createProject,
} from "../../controllers/projectsController";
import Project from "../../models/Project";
import User from "../../models/User";

// Mock mongoose ObjectId.isValid
jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    Types: {
      ...actualMongoose.Types,
      ObjectId: {
        isValid: jest.fn().mockReturnValue(true),
      },
    },
  };
});

// Mock dependencies
jest.mock("../../models/Project");
jest.mock("../../models/User");
jest.mock("express-validator", () => ({
  validationResult: jest.fn().mockImplementation(() => ({
    isEmpty: jest.fn().mockReturnValue(true),
    array: jest.fn().mockReturnValue([]),
  })),
}));

describe("Projects Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup response
    responseObject = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
    };
  });

  describe("getProjects", () => {
    const mockProjects = [
      {
        _id: "project1",
        title: "Project 1",
        status: "open",
        toObject: () => ({
          _id: "project1",
          title: "Project 1",
          status: "open",
          hasLiked: false,
        }),
      },
      {
        _id: "project2",
        title: "Project 2",
        status: "open",
        toObject: () => ({
          _id: "project2",
          title: "Project 2",
          status: "open",
          hasLiked: false,
        }),
      },
    ];

    const enhancedMockProjects = [
      { _id: "project1", title: "Project 1", status: "open", hasLiked: false },
      { _id: "project2", title: "Project 2", status: "open", hasLiked: false },
    ];

    beforeEach(() => {
      mockRequest = {
        query: {
          page: "1",
          limit: "10",
          sort: "createdAt",
          order: "desc",
        },
        user: { id: "user123", userId: "user123", role: "junior" },
      };

      // Mock Project.find chain with proper populate
      const mockFind = {
        countDocuments: jest.fn().mockResolvedValue(2),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProjects),
      };

      (Project.find as jest.Mock).mockReturnValue(mockFind);
      (Project.countDocuments as jest.Mock).mockResolvedValue(2);
    });

    it("should get all projects with default pagination", async () => {
      await getProjects(mockRequest as Request, mockResponse as Response);

      // Verify Project.find was called with empty query
      expect(Project.find).toHaveBeenCalledWith({});

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toHaveProperty("success", true);
      expect(responseObject).toHaveProperty("data");
      expect(responseObject.data).toHaveProperty("projects");
      // Instead of comparing objects directly, check if the enhanced objects have the expected properties
      expect(responseObject.data.projects).toHaveLength(2);
      expect(responseObject.data.projects[0]).toHaveProperty("_id", "project1");
      expect(responseObject.data.projects[0]).toHaveProperty("hasLiked", false);
      expect(responseObject.data).toHaveProperty("pagination");
      expect(responseObject.data.pagination).toHaveProperty("total", 2);
      expect(responseObject.data.pagination).toHaveProperty("page", 1);
      expect(responseObject.data.pagination).toHaveProperty("limit", 10);
      expect(responseObject.data.pagination).toHaveProperty("pages", 1);
    });

    it("should filter projects by status", async () => {
      mockRequest.query = { ...mockRequest.query, status: "open" };

      await getProjects(mockRequest as Request, mockResponse as Response);

      // Verify Project.find was called with status filter
      expect(Project.find).toHaveBeenCalledWith({ status: "open" });
    });

    it("should filter projects by skills", async () => {
      mockRequest.query = { ...mockRequest.query, skills: "react,nodejs" };

      await getProjects(mockRequest as Request, mockResponse as Response);

      // Verify Project.find was called with skills filter
      expect(Project.find).toHaveBeenCalledWith({
        skillsRequired: { $in: ["react", "nodejs"] },
      });
    });

    it("should search projects by text query", async () => {
      mockRequest.query = { ...mockRequest.query, search: "web application" };

      await getProjects(mockRequest as Request, mockResponse as Response);

      // Verify Project.find was called with text search
      expect(Project.find).toHaveBeenCalledWith({
        $text: { $search: "web application" },
      });
    });
  });

  describe("getProjectById", () => {
    const mockProject = {
      _id: "project1",
      title: "Test Project",
      description: "Test Description",
      company: "owner123",
      status: "open",
      userLikes: [],
      toJSON: () => ({
        _id: "project1",
        title: "Test Project",
        description: "Test Description",
        company: "owner123",
        status: "open",
      }),
    };

    beforeEach(() => {
      mockRequest = {
        params: { id: "project1" },
        user: { id: "user123", userId: "user123", role: "junior" },
      };

      // Mock Project.findById with proper populate chain
      (Project.findById as jest.Mock).mockImplementation(() => ({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockProject),
          }),
        }),
      }));
    });

    it("should get a project by ID", async () => {
      await getProjectById(mockRequest as Request, mockResponse as Response);

      // Verify Project.findById was called with the correct ID
      expect(Project.findById).toHaveBeenCalledWith("project1");

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toHaveProperty("success", true);
      expect(responseObject).toHaveProperty("data");
      expect(responseObject.data).toHaveProperty("_id", "project1");
      expect(responseObject.data).toHaveProperty("title", "Test Project");
    });

    it("should return 404 if project not found", async () => {
      // Mock Project.findById to return null
      (Project.findById as jest.Mock).mockImplementation(() => ({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
          }),
        }),
      }));

      await getProjectById(mockRequest as Request, mockResponse as Response);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty("success", false);
      expect(responseObject).toHaveProperty("error", "Project not found");
    });
  });

  describe("createProject", () => {
    const mockUser = {
      _id: "user123",
      role: "company",
      save: jest.fn().mockResolvedValue(true),
    };

    const mockProjectData = {
      title: "New Project",
      description: "Project Description",
      skillsRequired: ["react", "nodejs"],
      requirements: "Some requirements",
      timeframe: "2 weeks",
      tags: ["web", "frontend"],
    };

    const mockCreatedProject = {
      _id: "newProject123",
      ...mockProjectData,
      company: "user123",
      images: ["/uploads/projects/project-image.jpg"],
    };

    beforeEach(() => {
      // Reset all mocks
      jest.clearAllMocks();

      mockRequest = {
        body: mockProjectData,
        files: [
          {
            fieldname: "images",
            originalname: "test.jpg",
            encoding: "7bit",
            mimetype: "image/jpeg",
            destination: "/uploads",
            filename: "project-image.jpg",
            path: "/uploads/project-image.jpg",
            size: 12345,
            buffer: Buffer.from([]),
            stream: {} as any,
          },
        ],
        user: { id: "user123", userId: "user123", role: "company" },
      } as unknown as Partial<Request>;

      // Mock User.findById only for role checks in createProject
      (User.findById as jest.Mock).mockImplementation((id) => {
        if (id === "user123") {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      });

      // Mock User.findByIdAndUpdate
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // Mock Project constructor and save
      const mockSave = jest.fn().mockResolvedValue(mockCreatedProject);

      (Project as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        _id: "newProject123",
      }));
    });

    it("should create a new project", async () => {
      await createProject(mockRequest as Request, mockResponse as Response);

      // Verify Project constructor was called with the correct data
      expect(Project).toHaveBeenCalledWith({
        ...mockProjectData,
        company: "user123",
        images: expect.arrayContaining([
          expect.stringContaining("project-image.jpg"),
        ]),
      });

      // Verify User.findByIdAndUpdate was called
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
        $push: { projects: "newProject123" },
      });

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toHaveProperty("success", true);
      expect(responseObject).toHaveProperty("data");
      expect(responseObject.data).toHaveProperty("project");
    });

    it("should return 403 if user is not a company", async () => {
      // Create a new request with a junior role
      const juniorRequest = {
        ...mockRequest,
        user: { id: "user123", userId: "user123", role: "junior" },
      } as unknown as Request;

      await createProject(juniorRequest, mockResponse as Response);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject).toHaveProperty("success", false);
      expect(responseObject).toHaveProperty(
        "error",
        "Only companies can create projects"
      );
    });

    it("should handle missing user", async () => {
      // Create a request with no user or invalid user
      const noUserRequest = {
        ...mockRequest,
        user: null,
      } as unknown as Request;

      await createProject(noUserRequest, mockResponse as Response);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject).toHaveProperty("success", false);
      expect(responseObject).toHaveProperty(
        "error",
        "Only companies can create projects"
      );
    });
  });
});
