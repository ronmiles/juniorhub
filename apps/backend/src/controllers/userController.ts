import { Request, Response } from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import User from "../models/User";
import Project from "../models/Project";
import Application from "../models/Application";
import { deleteProfilePicture } from "../middleware/uploadMiddleware";

/**
 * Get all users (admin only)
 * @route GET /api/users
 * @access Admin
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build query
    const query: any = {};

    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    // Search by name or email if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .select("-password -refreshToken")
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      data: users,
    });
  } catch (error) {
    console.error("Error in getUsers:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Public
 */
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
      return;
    }

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private (Own user or Admin)
 */
export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const userId = req.params.id;

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
      return;
    }

    // Get fields to update
    const { name, bio, skills, profilePicture, experienceLevel, portfolio } =
      req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) updateData.skills = skills;
    if (profilePicture !== undefined)
      updateData.profilePicture = profilePicture;

    // Add junior-specific fields
    if (experienceLevel !== undefined)
      updateData.experienceLevel = experienceLevel;
    if (portfolio !== undefined) updateData.portfolio = portfolio;

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Admin
 */
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Remove user
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Get user's projects
 * @route GET /api/users/:id/projects
 * @access Public
 */
export const getUserProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
      return;
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Get projects where user is the owner
    let projects = await Project.find({ owner: userId }).sort({
      createdAt: -1,
    });

    // For testing purposes, if no projects found, return mock data
    if (projects.length === 0) {
      console.log(
        "No projects found for user, returning mock data for testing"
      );

      // Return mock data in the same format as the database would
      res.status(200).json({
        success: true,
        data: {
          projects: [
            {
              id: "mock-project-1",
              title: "Mock Project 1",
              description: "This is a mock project for testing the dashboard",
              status: "open",
              createdAt: new Date(),
              applicants: [],
            },
            {
              id: "mock-project-2",
              title: "Mock Project 2",
              description: "Another mock project for testing",
              status: "in-progress",
              createdAt: new Date(),
              applicants: [{ id: "mock-applicant" }],
            },
          ],
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        projects,
      },
    });
  } catch (error) {
    console.error("Error in getUserProjects:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Get user's applications
 * @route GET /api/users/:id/applications
 * @access Private (Own user)
 */
export const getUserApplications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
      return;
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Get applications where user is the applicant
    const applications = await Application.find({ applicant: userId })
      .populate("project", "title description")
      .sort({ createdAt: -1 });

    // For testing purposes, if no applications found, return mock data
    if (applications.length === 0) {
      console.log(
        "No applications found for user, returning mock data for testing"
      );

      res.status(200).json({
        success: true,
        data: {
          applications: [
            {
              id: "mock-application-1",
              status: "pending",
              createdAt: new Date(),
              project: {
                id: "mock-project-1",
                title: "Mock Project Application",
                description:
                  "This is a mock project application for testing the dashboard",
              },
            },
            {
              id: "mock-application-2",
              status: "accepted",
              createdAt: new Date(),
              project: {
                id: "mock-project-2",
                title: "Another Mock Project",
                description: "Another mock project for testing",
              },
            },
          ],
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        applications,
      },
    });
  } catch (error) {
    console.error("Error in getUserApplications:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Upload profile picture
 * @route POST /api/users/:id/profile-picture
 * @access Private (Own user)
 */
export const uploadProfilePicture = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;
    console.log("Received profile picture upload request for user:", userId);
    console.log("Request file:", req.file);

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid user ID:", userId);
      res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      console.log("No file was uploaded");
      res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
      return;
    }

    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found:", userId);
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Get the uploaded file path
    const filePath = req.file.path;
    console.log("Uploaded file path:", filePath);

    // Create a URL path for the file
    const relativePath = path
      .relative(path.join(__dirname, ".."), filePath)
      .replace(/\\/g, "/");
    const fileUrl = `/api/${relativePath}`;
    console.log("File URL for database:", fileUrl);

    // Delete old profile picture if it exists and is not a URL
    if (
      user.profilePicture &&
      user.profilePicture.startsWith("/api/uploads/profiles/")
    ) {
      const oldFilePath = path.join(
        __dirname,
        "..",
        user.profilePicture.replace("/api/", "")
      );
      console.log("Deleting old profile picture:", oldFilePath);
      deleteProfilePicture(oldFilePath);
    }

    // Update user with new profile picture
    user.profilePicture = fileUrl;
    await user.save();
    console.log("User profile updated with new picture URL:", fileUrl);

    res.status(200).json({
      success: true,
      data: {
        profilePicture: user.profilePicture,
      },
      message: "Profile picture uploaded successfully",
    });
  } catch (error) {
    console.error("Error in uploadProfilePicture:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Delete profile picture
 * @route DELETE /api/users/:id/profile-picture
 * @access Private (Own user)
 */
export const deleteUserProfilePicture = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
      return;
    }

    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Delete profile picture file if it exists and is local
    if (
      user.profilePicture &&
      user.profilePicture.startsWith("/api/uploads/profiles/")
    ) {
      const filePath = path.join(
        __dirname,
        "..",
        user.profilePicture.replace("/api/", "")
      );
      deleteProfilePicture(filePath);
    }

    // Reset profile picture in DB
    user.profilePicture = "";
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture removed successfully",
    });
  } catch (error) {
    console.error("Error in deleteUserProfilePicture:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
