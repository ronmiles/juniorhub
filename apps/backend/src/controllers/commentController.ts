import { Request, Response } from "express";
import Comment from "../models/Comment";
import Project from "../models/Project";
import { validationResult } from "express-validator";
import {
  broadcastNewComment,
  broadcastCommentUpdate,
  broadcastCommentDelete,
} from "../utils/socket";

/**
 * Get comments for a project
 * @route GET /api/projects/:projectId/comments
 * @access Public
 */
export const getProjectComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Pagination
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Find project first to ensure it exists
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: "Project not found",
      });
      return;
    }

    // Get comments with pagination and sorted by newest first
    const comments = await Comment.find({ project: projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .populate("author", "name email profilePicture role");

    // Get total count for pagination
    const total = await Comment.countDocuments({ project: projectId });
    const totalPages = Math.ceil(total / limitNumber);

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          total,
          pages: totalPages,
          page: pageNumber,
          limit: limitNumber,
        },
      },
    });
  } catch (error) {
    console.error("Get project comments error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Create a new comment
 * @route POST /api/projects/:projectId/comments
 * @access Private
 */
export const createComment = async (
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

    const { projectId } = req.params;
    const { content } = req.body;

    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
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

    // Create new comment
    const comment = new Comment({
      project: projectId,
      author: req.user.userId,
      content,
    });

    await comment.save();

    // Populate author information for the response
    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "name email profilePicture role"
    );

    // Broadcast the new comment to all users viewing the project
    broadcastNewComment(projectId, populatedComment);

    res.status(201).json({
      success: true,
      data: { comment: populatedComment },
      message: "Comment created successfully",
    });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Update a comment
 * @route PUT /api/comments/:commentId
 * @access Private (Comment author only)
 */
export const updateComment = async (
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

    const { commentId } = req.params;
    const { content } = req.body;

    // Find comment
    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({
        success: false,
        error: "Comment not found",
      });
      return;
    }

    // Check ownership
    if (
      !req.user ||
      (comment.author.toString() !== req.user.userId &&
        req.user.role !== "admin")
    ) {
      res.status(403).json({
        success: false,
        error: "Not authorized to update this comment",
      });
      return;
    }

    // Update comment
    comment.content = content;
    await comment.save();

    // Populate author information for the response
    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "name email profilePicture role"
    );

    // Broadcast the updated comment to all users viewing the project
    broadcastCommentUpdate(comment.project.toString(), populatedComment);

    res.status(200).json({
      success: true,
      data: { comment: populatedComment },
      message: "Comment updated successfully",
    });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Delete a comment
 * @route DELETE /api/comments/:commentId
 * @access Private (Comment author or Admin)
 */
export const deleteComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { commentId } = req.params;

    // Find comment
    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({
        success: false,
        error: "Comment not found",
      });
      return;
    }

    // Check ownership
    if (
      !req.user ||
      (comment.author.toString() !== req.user.userId &&
        req.user.role !== "admin")
    ) {
      res.status(403).json({
        success: false,
        error: "Not authorized to delete this comment",
      });
      return;
    }

    // Store project ID before deleting for socket broadcast
    const projectId = comment.project.toString();

    // Delete comment
    await comment.deleteOne();

    // Broadcast the comment deletion to all users viewing the project
    broadcastCommentDelete(projectId, commentId);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
