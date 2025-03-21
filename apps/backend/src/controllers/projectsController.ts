import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Project from "../models/Project";
import User from "../models/User";
import Application from "../models/Application";
import mongoose from "mongoose";
import path from "path";
import {
  getFilePathFromUrl,
  deleteProjectImage,
} from "../middleware/uploadMiddleware";
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

    // Log image URLs for debugging
    if (project.images && project.images.length > 0) {
      console.log("Project images found:", project.images);
    } else {
      console.log("No images found for project:", req.params.id);
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
 * Get all applications for a specific project
 * @route GET /api/projects/:id/applications
 * @access Private (Project owner only)
 */
export const getProjectApplications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const projectId = req.params.id;
    const userId = req.user.userId;

    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      res.status(400).json({
        success: false,
        error: "Invalid project ID",
      });
      return;
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: "Project not found",
      });
      return;
    }

    // Verify project ownership
    if (project.company.toString() !== userId && req.user.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Unauthorized - Only the project owner can view applications",
      });
      return;
    }

    // Build query
    const query: any = { project: projectId };

    // Apply status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Get applications with applicant details
    const applications = await Application.find(query)
      .populate({
        path: "applicant",
        select:
          "name email profilePicture skills experienceLevel bio portfolioUrl",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        applications,
        count: applications.length,
      },
    });
  } catch (error) {
    console.error("Get project applications error:", error);
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

    // Process uploaded images if they exist
    const images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      // Create URLs for each uploaded image
      req.files.forEach((file) => {
        const relativePath = path
          .relative(path.join(__dirname, ".."), file.path)
          .replace(/\\/g, "/");
        const fileUrl = `/api/${relativePath}`;
        console.log("Created file URL:", fileUrl, "from path:", file.path);
        images.push(fileUrl);
      });
    }

    // Create new project
    const project = new Project({
      title,
      description,
      company: req.user.userId,
      requirements,
      timeframe,
      skillsRequired,
      tags,
      images, // Add the image URLs to the project
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

    // Log entire request body for debugging
    console.log("Update project request body:", req.body);
    console.log("Update project request files:", req.files);

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
      imagesToRemove,
    } = req.body;

    // Process uploaded images if they exist
    let existingImages = project.images || [];

    console.log("Original images:", existingImages);
    console.log("Images to remove:", imagesToRemove);

    // Remove images if specified
    if (imagesToRemove) {
      // Handle both array and string formats from form data
      let imagesToRemoveArray: string[] = [];

      if (Array.isArray(imagesToRemove)) {
        imagesToRemoveArray = imagesToRemove;
      } else if (typeof imagesToRemove === "string") {
        imagesToRemoveArray = [imagesToRemove];
      } else if (typeof imagesToRemove === "object") {
        // Handle when form data sends it as an object with indices as keys
        imagesToRemoveArray = Object.values(imagesToRemove);
      }

      console.log("Processed images to remove:", imagesToRemoveArray);

      // Delete files from filesystem
      imagesToRemoveArray.forEach((imageUrl) => {
        const filePath = getFilePathFromUrl(imageUrl);
        if (filePath) {
          console.log("Deleting image file:", filePath);
          deleteProjectImage(filePath);
        }
      });

      // Remove from the existing images array
      existingImages = existingImages.filter(
        (img) => !imagesToRemoveArray.includes(img)
      );

      console.log("Remaining images after removal:", existingImages);
    }

    // Add new uploaded images
    if (req.files && Array.isArray(req.files)) {
      // Create URLs for each uploaded image
      req.files.forEach((file) => {
        const relativePath = path
          .relative(path.join(__dirname, ".."), file.path)
          .replace(/\\/g, "/");
        const fileUrl = `/api/${relativePath}`;
        console.log("Created file URL:", fileUrl, "from path:", file.path);
        existingImages.push(fileUrl);
      });
    }

    // Update project fields
    if (title) project.title = title;
    if (description) project.description = description;
    if (requirements) project.requirements = requirements;
    if (timeframe) project.timeframe = timeframe;
    if (status) project.status = status;
    if (skillsRequired) project.skillsRequired = skillsRequired;
    if (tags) project.tags = tags;

    // Update images
    project.images = existingImages;

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
