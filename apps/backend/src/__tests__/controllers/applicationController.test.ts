import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  getApplicationById,
  createApplication,
} from "../../controllers/applicationController";
import Application from "../../models/Application";
import Project from "../../models/Project";
import User from "../../models/User";
import * as notificationController from "../../controllers/notificationController";
import * as socketUtils from "../../utils/socket";

// Mock mongoose.Types.ObjectId.isValid
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
jest.mock("../../models/Application");
jest.mock("../../models/Project");
jest.mock("../../models/User");
jest.mock("../../controllers/notificationController");
jest.mock("../../utils/socket");
jest.mock("express-validator", () => ({
  validationResult: jest.fn().mockImplementation(() => ({
    isEmpty: jest.fn().mockReturnValue(true),
    array: jest.fn().mockReturnValue([]),
  })),
}));

describe("Application Controller", () => {
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

  describe("getApplicationById", () => {
    const mockApplication = {
      _id: "app1",
      project: {
        _id: "project1",
        title: "Project 1",
        description: "Description",
        company: {
          _id: "company1",
          name: "Company 1",
          profilePicture: "profile.jpg",
        },
      },
      applicant: {
        _id: "user1",
        name: "User 1",
        email: "user@example.com",
        profilePicture: "profile.jpg",
      },
      status: "pending",
      coverLetter: "Cover letter content",
    };

    beforeEach(() => {
      mockRequest = {
        params: { id: "app1" },
        user: { id: "user1", userId: "user1", role: "junior" },
      };

      // Mock Application.findById
      (Application.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockApplication),
        }),
      });
    });

    it("should get an application by ID", async () => {
      await getApplicationById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Verify Application.findById was called with the correct ID
      expect(Application.findById).toHaveBeenCalledWith("app1");

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toHaveProperty("success", true);
      expect(responseObject).toHaveProperty("data");
      expect(responseObject.data).toHaveProperty(
        "application",
        mockApplication
      );
    });

    it("should return 404 if application not found", async () => {
      // Mock Application.findById to return null
      (Application.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      await getApplicationById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty("success", false);
      expect(responseObject).toHaveProperty("error", "Application not found");
    });

    it("should return 403 if user is not authorized to view the application", async () => {
      // User is neither applicant nor project owner
      mockRequest.user = {
        id: "otherUser",
        userId: "otherUser",
        role: "junior",
      };

      await getApplicationById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject).toHaveProperty("success", false);
      expect(responseObject).toHaveProperty(
        "error",
        "Not authorized to view this application"
      );
    });
  });

  describe("createApplication", () => {
    const mockProject = {
      _id: "project1",
      title: "Test Project",
      description: "Project Description",
      isAcceptingApplications: true,
      company: {
        _id: "company1",
        name: "Test Company",
      },
      save: jest.fn().mockResolvedValue(true),
    };

    const mockUser = {
      _id: "user1",
      role: "junior",
      save: jest.fn().mockResolvedValue(true),
    };

    const mockApplication = {
      _id: "newApp123",
      project: "project1",
      applicant: "user1",
      status: "pending",
      coverLetter: "I am interested in this project",
      save: jest.fn().mockResolvedValue({
        _id: "newApp123",
        project: "project1",
        applicant: "user1",
      }),
      populate: jest.fn().mockImplementation(function () {
        this.project = mockProject;
        this.applicant = mockUser;
        return Promise.resolve(this);
      }),
    };

    beforeEach(() => {
      mockRequest = {
        params: { id: "project1" },
        body: {
          coverLetter: "I am interested in this project",
        },
        user: { id: "user1", userId: "user1", role: "junior" },
      };

      // Reset application mock for each test
      mockApplication.save = jest.fn().mockResolvedValue({
        _id: "newApp123",
        project: "project1",
        applicant: "user1",
      });

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Mock Project.findById
      (Project.findById as jest.Mock).mockImplementation(() => {
        // Create a mock object that can be both awaited as a Promise and has a populate method
        const mockWithPopulate: any = Promise.resolve(mockProject);
        // Add the populate method to the Promise object
        mockWithPopulate.populate = jest.fn().mockReturnValue({
          ...mockProject,
          company: {
            _id: "company1",
            name: "Test Company",
          },
        });
        return mockWithPopulate;
      });

      // Mock Project.findByIdAndUpdate
      (Project.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockProject);

      // Mock User.findById
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      // Mock Application.findOne - default to no existing application
      (Application.findOne as jest.Mock).mockResolvedValue(null);

      // Mock User.findByIdAndUpdate
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({ ...mockUser });

      // Mock Application constructor
      (Application as unknown as jest.Mock).mockImplementation(
        () => mockApplication
      );

      // Mock notification functions
      (
        notificationController.createNotification as jest.Mock
      ).mockResolvedValue({
        _id: "notification1",
      });

      (socketUtils.sendNotificationToUser as jest.Mock).mockImplementation(
        () => {}
      );
    });

    it("should create a new application", async () => {
      await createApplication(mockRequest as Request, mockResponse as Response);

      // Verify Project.findById was called
      expect(Project.findById).toHaveBeenCalled();

      // Check that application search was performed (without checking exact arguments)
      expect(Application.findOne).toHaveBeenCalled();

      // Verify Application constructor was called with the correct data
      expect(Application).toHaveBeenCalledWith({
        project: "project1",
        applicant: "user1",
        coverLetter: "I am interested in this project",
        submissionLink: null,
        status: "pending",
      });

      // Verify User.findByIdAndUpdate was called
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user1", {
        $push: { applications: "newApp123" },
      });

      // Verify Project.findByIdAndUpdate was called
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith("project1", {
        $push: { applications: "newApp123" },
      });

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toHaveProperty("success", true);
      expect(responseObject).toHaveProperty("data");
      expect(responseObject.data).toHaveProperty("application");
    });

    it("should return 404 if project not found", async () => {
      // Mock Project.findById to return null
      (Project.findById as jest.Mock).mockResolvedValue(null);

      await createApplication(mockRequest as Request, mockResponse as Response);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty("success", false);
      expect(responseObject).toHaveProperty("error", "Project not found");
    });

    it("should return 400 if project is not accepting applications", async () => {
      // Mock project with isAcceptingApplications set to false
      const notAcceptingProject = {
        ...mockProject,
        isAcceptingApplications: false,
      };

      // Mock with proper type handling
      (Project.findById as jest.Mock).mockImplementation(() => {
        const mockWithPopulate: any = Promise.resolve(notAcceptingProject);
        mockWithPopulate.populate = jest
          .fn()
          .mockReturnValue(notAcceptingProject);
        return mockWithPopulate;
      });

      await createApplication(mockRequest as Request, mockResponse as Response);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toHaveProperty("success", false);
      expect(responseObject).toHaveProperty(
        "error",
        "Project is not accepting applications"
      );
    });

    it("should return 400 if user already applied", async () => {
      // Mock Application.findOne to return an existing application
      (Application.findOne as jest.Mock).mockResolvedValue({
        _id: "existingApp",
      });

      // Reset Project mock to accepting applications
      (Project.findById as jest.Mock).mockImplementation(() => {
        const mockWithPopulate: any = Promise.resolve(mockProject);
        mockWithPopulate.populate = jest.fn().mockReturnValue(mockProject);
        return mockWithPopulate;
      });

      await createApplication(mockRequest as Request, mockResponse as Response);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toHaveProperty("success", false);
      expect(responseObject).toHaveProperty(
        "error",
        "You have already applied to this project"
      );
    });
  });
});
