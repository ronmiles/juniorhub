import express from "express";
import { body } from "express-validator";
import {
  getProjectComments,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController";
import { authenticate, optionalAuthenticate } from "../middleware/auth";
import { SwaggerPathsType } from "../types/swagger";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Project comments
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         projectId:
 *           type: string
 *         userId:
 *           type: string
 *         content:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export const commentPaths: SwaggerPathsType = {
  "/api/projects/{projectId}/comments": {
    get: {
      summary: "Get comments for a project",
      tags: ["Comments"],
      parameters: [
        {
          in: "path",
          name: "projectId",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        "200": {
          description: "List of comments",
        },
      },
    },
    post: {
      summary: "Add a comment to a project",
      tags: ["Comments"],
      parameters: [
        {
          in: "path",
          name: "projectId",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["content"],
              properties: {
                content: {
                  type: "string",
                  minLength: 1,
                  maxLength: 2000,
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Comment created successfully",
        },
      },
    },
  },
  "/api/comments/{commentId}": {
    put: {
      summary: "Update a comment",
      tags: ["Comments"],
      parameters: [
        {
          in: "path",
          name: "commentId",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["content"],
              properties: {
                content: {
                  type: "string",
                  minLength: 1,
                  maxLength: 2000,
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Comment updated successfully",
        },
      },
    },
    delete: {
      summary: "Delete a comment",
      tags: ["Comments"],
      parameters: [
        {
          in: "path",
          name: "commentId",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        "200": {
          description: "Comment deleted successfully",
        },
      },
    },
  },
};

export const commentComponents = {
  schemas: {
    Comment: {
      type: "object",
      properties: {
        id: {
          type: "string",
        },
        projectId: {
          type: "string",
        },
        userId: {
          type: "string",
        },
        content: {
          type: "string",
        },
        createdAt: {
          type: "string",
          format: "date-time",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
        },
      },
    },
  },
};

/**
 * @swagger
 * /api/projects/{projectId}/comments:
 *   get:
 *     summary: Get all comments for a project
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of comments with pagination info
 */
router.get(
  "/projects/:projectId/comments",
  optionalAuthenticate,
  getProjectComments
);

/**
 * @swagger
 * /api/projects/{projectId}/comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Comment content
 *     responses:
 *       201:
 *         description: Comment created successfully
 */
router.post(
  "/projects/:projectId/comments",
  [
    authenticate,
    body("content")
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage("Comment must be between 1 and 2000 characters"),
  ],
  createComment
);

/**
 * @swagger
 * /api/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated comment content
 *     responses:
 *       200:
 *         description: Comment updated successfully
 */
router.put(
  "/comments/:commentId",
  [
    authenticate,
    body("content")
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage("Comment must be between 1 and 2000 characters"),
  ],
  updateComment
);

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 */
router.delete("/comments/:commentId", authenticate, deleteComment);

export default router;
