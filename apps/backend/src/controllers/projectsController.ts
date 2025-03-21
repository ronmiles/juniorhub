import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Project from "../models/Project";
import User from "../models/User";
import Application from "../models/Application";
import mongoose from "mongoose";
/**
 * Get all projects with filtering options
 * @route GET /api/projects
 * @access Public
 */
export const getProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      status,
      skills,
      search,
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Build query
    const query: any = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by skills required
    if (skills) {
      const skillsArray = (skills as string).split(",");
      query.skillsRequired = { $in: skillsArray };
    }

    // Search by title, description, or tags
    if (search) {
      query.$text = { $search: search as string };
    }

    // Pagination
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Sorting
    const sortOptions: any = {};
    sortOptions[sort as string] = order === "asc" ? 1 : -1;

    // Execute query with pagination
    const projects = await Project.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber)
      .populate("company", "name email profilePicture");

    // Get total count for pagination
    const total = await Project.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Get a single project by ID
 * @route GET /api/projects/:id
 * @access Public
 */
export const getProjectById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("company", "name email profilePicture bio createdAt")
      .populate("selectedDeveloper", "name email profilePicture");

    if (!project) {
      res.status(404).json({
        success: false,
        error: "Project not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Create a new project
 * @route POST /api/projects
 * @access Private (Companies only)
 */
export const createProject = async (
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

    // Only companies can create projects
    if (!req.user || req.user.role !== "company") {
      res.status(403).json({
        success: false,
        error: "Only companies can create projects",
      });
      return;
    }

    const {
      title,
      description,
      requirements,
      timeframe,
      skillsRequired,
      tags,
    } = req.body;

    // Create new project
    const project = new Project({
      title,
      description,
      company: req.user.userId,
      requirements,
      timeframe,
      skillsRequired,
      tags,
    });

    await project.save();

    // Add project to company's projects
    await User.findByIdAndUpdate(req.user.userId, {
      $push: { projects: project._id },
    });

    res.status(201).json({
      success: true,
      data: { project },
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Update a project
 * @route PUT /api/projects/:id
 * @access Private (Project owner or Admin)
 */
export const updateProject = async (
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

    // Find project
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: "Project not found",
      });
      return;
    }

    // Check ownership
    if (
      !req.user ||
      (project.company.toString() !== req.user.userId &&
        req.user.role !== "admin")
    ) {
      res.status(403).json({
        success: false,
        error: "Not authorized to update this project",
      });
      return;
    }

    const {
      title,
      description,
      requirements,
      timeframe,
      status,
      skillsRequired,
      tags,
    } = req.body;

    // Update project fields
    if (title) project.title = title;
    if (description) project.description = description;
    if (requirements) project.requirements = requirements;
    if (timeframe) project.timeframe = timeframe;
    if (status) project.status = status;
    if (skillsRequired) project.skillsRequired = skillsRequired;
    if (tags) project.tags = tags;

    await project.save();

    res.status(200).json({
      success: true,
      data: { project },
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Delete a project
 * @route DELETE /api/projects/:id
 * @access Private (Project owner or Admin)
 */
export const deleteProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Find project
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: "Project not found",
      });
      return;
    }

    // Check ownership
    if (
      !req.user ||
      (project.company.toString() !== req.user.userId &&
        req.user.role !== "admin")
    ) {
      res.status(403).json({
        success: false,
        error: "Not authorized to delete this project",
      });
      return;
    }

    // Check if there are already accepted applications
    const hasAcceptedApplications = await Application.exists({
      project: project._id,
      status: "accepted",
    });

    if (hasAcceptedApplications) {
      res.status(400).json({
        success: false,
        error: "Cannot delete project with accepted applications",
      });
      return;
    }

    // Delete all applications for this project
    await Application.deleteMany({ project: project._id });

    // Remove project from company's projects
    await User.findByIdAndUpdate(project.company, {
      $pull: { projects: project._id },
    });

    // Delete project
    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Apply to a project
 * @route POST /api/projects/:id/apply
 * @access Private (Juniors only)
 */
export const applyToProject = async (
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

    // Only juniors can apply
    if (!req.user || req.user.role !== "junior") {
      res.status(403).json({
        success: false,
        error: "Only junior developers can apply to projects",
      });
      return;
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: "Project not found",
      });
      return;
    }

    // Check if project is open
    if (project.status !== "open") {
      res.status(400).json({
        success: false,
        error: "This project is not accepting applications",
      });
      return;
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      project: project._id,
      applicant: req.user.userId,
    });

    if (existingApplication) {
      res.status(400).json({
        success: false,
        error: "You have already applied to this project",
      });
      return;
    }

    const { coverLetter, submissionLink } = req.body;

    // Create application
    const application = new Application({
      project: project._id,
      applicant: req.user.userId,
      coverLetter,
      submissionLink,
    });

    await application.save();

    // Update project's applications
    project.applications = [
      ...(project.applications || []),
      new mongoose.Types.ObjectId(req.user.userId),
    ];
    await project.save();

    // Update user's applications
    await User.findByIdAndUpdate(req.user.userId, {
      $push: { applications: application._id },
    });

    res.status(201).json({
      success: true,
      data: { application },
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Apply to project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
