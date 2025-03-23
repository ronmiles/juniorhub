import { Request, Response } from "express";
import bcrypt from "bcrypt";
import * as jwtUtils from "../../utils/jwt";
import {
  register,
  login,
  refreshToken,
} from "../../controllers/auth/authController";
import User from "../../models/User";
import mongoose from "mongoose";

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
jest.mock("../../models/User");
jest.mock("../../utils/jwt");
jest.mock("bcrypt");
jest.mock("express-validator", () => ({
  validationResult: jest.fn().mockImplementation(() => ({
    isEmpty: jest.fn().mockReturnValue(true),
    array: jest.fn().mockReturnValue([]),
  })),
}));

describe("Auth Controller", () => {
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

  describe("register", () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          role: "junior",
        },
        user: { id: "testUser", userId: "testUser", role: "junior" },
      };

      // Mock User.findOne to return null (user doesn't exist)
      (User.findOne as jest.Mock).mockResolvedValue(null);

      // Mock bcrypt functions
      (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

      // Mock User.save
      const mockSave = jest.fn().mockResolvedValue(true);
      (User as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        _id: "mockUserId",
        name: "Test User",
        email: "test@example.com",
        role: "junior",
        refreshToken: null,
        accessToken: null,
        toObject: jest.fn().mockReturnValue({
          _id: "mockUserId",
          name: "Test User",
          email: "test@example.com",
          role: "junior",
        }),
      }));

      // Mock generateTokens
      (jwtUtils.generateTokens as jest.Mock).mockReturnValue({
        accessToken: "mockAccessToken",
        refreshToken: "mockRefreshToken",
      });
    });

    it("should register a new user successfully", async () => {
      await register(mockRequest as Request, mockResponse as Response);

      // Check if User.findOne was called with the correct email
      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });

      // Verify bcrypt was called correctly
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", "salt");

      // Verify User constructor was called with the correct data
      expect(User).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword",
        role: "junior",
      });

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toHaveProperty("success", true);
      expect(responseObject).toHaveProperty("data");
      expect(responseObject.data).toHaveProperty("user");
      expect(responseObject.data).toHaveProperty("tokens");
    });

    it("should return 400 if user already exists", async () => {
      // Mock User.findOne to return an existing user
      (User.findOne as jest.Mock).mockResolvedValue({ _id: "existingUserId" });

      await register(mockRequest as Request, mockResponse as Response);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toHaveProperty("success", false);
      expect(responseObject).toHaveProperty(
        "error",
        "User already exists with this email"
      );
    });
  });

  describe("login", () => {
    const mockUser = {
      _id: "mockUserId",
      email: "test@example.com",
      password: "hashedPassword",
      role: "junior",
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
      refreshToken: null,
      toObject: jest.fn().mockReturnValue({
        _id: "mockUserId",
        email: "test@example.com",
        role: "junior",
      }),
    };

    beforeEach(() => {
      mockRequest = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
        user: { id: "testUser", userId: "testUser", role: "junior" },
      };

      // Mock User.findOne with select chaining
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      // Mock bcrypt.compare
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock generateTokens
      (jwtUtils.generateTokens as jest.Mock).mockReturnValue({
        accessToken: "mockAccessToken",
        refreshToken: "mockRefreshToken",
      });
    });

    it("should login user successfully with valid credentials", async () => {
      await login(mockRequest as Request, mockResponse as Response);

      // Check if User.findOne was called with the correct email
      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });

      // Verify bcrypt.compare was called correctly
      expect(mockUser.comparePassword).toHaveBeenCalledWith("password123");

      // Verify generateTokens was called with the correct user ID and role
      expect(jwtUtils.generateTokens).toHaveBeenCalledWith(
        "mockUserId",
        "junior"
      );

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toHaveProperty("success", true);
      expect(responseObject).toHaveProperty("data");
      expect(responseObject.data).toHaveProperty("user");
      expect(responseObject.data).toHaveProperty("tokens");
    });

    it("should return 400 if user not found", async () => {
      // Mock User.findOne to return null (user doesn't exist)
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await login(mockRequest as Request, mockResponse as Response);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toHaveProperty("success", false);
      expect(responseObject).toHaveProperty("error", "Invalid credentials");
    });

    it("should return 400 if password is incorrect", async () => {
      // Mock comparePassword to return false (incorrect password)
      const userWithInvalidPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithInvalidPassword),
      });

      await login(mockRequest as Request, mockResponse as Response);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toHaveProperty("success", false);
      expect(responseObject).toHaveProperty("error", "Invalid credentials");
    });
  });

  describe("refreshToken", () => {
    const mockUser = {
      _id: "mockUserId",
      role: "junior",
      refreshToken: "validRefreshToken",
      save: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue({
        _id: "mockUserId",
        role: "junior",
      }),
    };

    beforeEach(() => {
      mockRequest = {
        body: {
          refreshToken: "validRefreshToken",
        },
        user: { id: "testUser", userId: "testUser", role: "junior" },
      };

      // Mock verifyRefreshToken
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: "mockUserId",
      });

      // Mock User.findById with select chaining
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      // Mock generateTokens
      (jwtUtils.generateTokens as jest.Mock).mockReturnValue({
        accessToken: "newAccessToken",
        refreshToken: "newRefreshToken",
      });
    });

    it("should refresh tokens successfully with valid refresh token", async () => {
      await refreshToken(mockRequest as Request, mockResponse as Response);

      // Verify verifyRefreshToken was called with the correct token
      expect(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith(
        "validRefreshToken"
      );

      // Verify User.findById was called with the correct user ID
      expect(User.findById).toHaveBeenCalledWith("mockUserId");

      // Verify generateTokens was called with the correct user ID and role
      expect(jwtUtils.generateTokens).toHaveBeenCalledWith(
        "mockUserId",
        "junior"
      );

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toHaveProperty("success", true);
      expect(responseObject).toHaveProperty("data");
      expect(responseObject.data).toHaveProperty("tokens");
      expect(responseObject.data.tokens).toHaveProperty(
        "accessToken",
        "newAccessToken"
      );
      expect(responseObject.data.tokens).toHaveProperty(
        "refreshToken",
        "newRefreshToken"
      );
    });

    it("should return 401 if refresh token is invalid", async () => {
      // Mock verifyRefreshToken to return null (invalid token)
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(null);

      await refreshToken(mockRequest as Request, mockResponse as Response);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject).toHaveProperty("success", false);
      expect(responseObject).toHaveProperty(
        "error",
        "Invalid or expired refresh token"
      );
    });

    it("should return 404 if user not found", async () => {
      // Mock User.findById to return null (user not found)
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await refreshToken(mockRequest as Request, mockResponse as Response);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject).toHaveProperty("success", false);
      expect(responseObject).toHaveProperty("error", "Invalid refresh token");
    });
  });
});
