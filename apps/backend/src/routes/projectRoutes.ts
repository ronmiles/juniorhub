import express from "express";
import { body } from "express-validator";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectApplications,
  toggleLike,
} from "../controllers/projectsController";
import { createApplication } from "../controllers/applicationController";
import {
  authenticate,
  authorize,
  companyOnly,
  juniorOnly,
  optionalAuthenticate,
} from "../middleware/auth";
import {
  uploadProjectImages,
  handleUploadError,
} from "../middleware/uploadMiddleware";
import { SwaggerPathsType } from "../types/swagger";

// Export Swagger paths for projects
export const projectPaths: SwaggerPathsType = {
  "/api/projects": {
    get: {
      summary: "Get all projects",
      tags: ["Projects"],
      parameters: [
        {
          in: "query",
          name: "search",
          schema: {
            type: "string",
          },
          description: "Search by title or description",
        },
        {
          in: "query",
          name: "skills",
          schema: {
            type: "array",
            items: {
              type: "string",
            },
          },
          description: "Filter by skills (comma-separated)",
        },
        {
          in: "query",
          name: "page",
          schema: {
            type: "integer",
            default: 1,
          },
          description: "Page number",
        },
        {
          in: "query",
          name: "limit",
          schema: {
            type: "integer",
            default: 10,
          },
          description: "Items per page",
        },
      ],
      responses: {
        "200": {
          description: "List of projects",
        },
      },
    },
    post: {
      summary: "Create a new project",
      tags: ["Projects"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "description"],
              properties: {
                title: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                skills: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                images: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Project created successfully",
        },
        "400": {
          description: "Invalid input data",
        },
      },
    },
  },
  "/api/projects/{id}": {
    get: {
      summary: "Get project by ID",
      tags: ["Projects"],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        "200": {
          description: "Project details",
        },
        "404": {
          description: "Project not found",
        },
      },
    },
    put: {
      summary: "Update a project",
      tags: ["Projects"],
      parameters: [
        {
          in: "path",
          name: "id",
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
              properties: {
                title: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                skills: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                images: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Project updated successfully",
        },
        "404": {
          description: "Project not found",
        },
      },
    },
    delete: {
      summary: "Delete a project",
      tags: ["Projects"],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        "200": {
          description: "Project deleted successfully",
        },
        "404": {
          description: "Project not found",
        },
      },
    },
  },
  "/api/projects/{id}/applications": {
    get: {
      summary: "Get applications for a project",
      tags: ["Projects"],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        "200": {
          description: "List of applications for the project",
        },
        "404": {
          description: "Project not found",
        },
      },
    },
  },
  "/api/projects/{id}/like": {
    post: {
      summary: "Toggle like on a project",
      tags: ["Projects"],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string",
          },
          description: "Project ID",
        },
      ],
      responses: {
        "200": {
          description: "Like toggled successfully",
        },
        "404": {
          description: "Project not found",
        },
      },
    },
  },
};

export const projectComponents = {
  schemas: {
    Project: {
      type: "object",
      required: ["title", "description"],
      properties: {
        id: {
          type: "string",
        },
        title: {
          type: "string",
        },
        description: {
          type: "string",
        },
        skills: {
          type: "array",
          items: {
            type: "string",
          },
        },
        images: {
          type: "array",
          items: {
            type: "string",
          },
        },
        createdBy: {
          type: "string",
        },
        createdAt: {
          type: "string",
          format: "date-time",
        },
        likes: {
          type: "number",
        },
      },
    },
  },
};

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated project ID
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         createdBy:
 *           type: string
 *           description: User ID of project creator
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects with filtering options
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in-progress, completed, canceled]
 *         description: Filter by project status
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Comma-separated list of skills to filter by
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title, description, or tags
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
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, oldest, most-applications]
 *           default: latest
 *         description: Sort order for projects
 *     responses:
 *       200:
 *         description: List of projects with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     projects:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Project'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 */
router.get("/", optionalAuthenticate, getProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     project:
 *                       $ref: '#/components/schemas/Project'
 */
router.get("/:id", optionalAuthenticate, getProjectById);

/**
 * @swagger
 * /api/projects/{id}/applications:
 *   get:
 *     summary: Get all applications for a project
 *     tags: [Projects, Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by application status
 *     responses:
 *       200:
 *         description: List of applications for the project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     applications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Application'
 */
router.get(
  "/:id/applications",
  authenticate,
  companyOnly,
  getProjectApplications
);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               timeframe:
 *                 type: object
 *                 properties:
 *                   startDate:
 *                     type: string
 *                     format: date
 *                   endDate:
 *                     type: string
 *                     format: date
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               projectImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     project:
 *                       $ref: '#/components/schemas/Project'
 */
router.post(
  "/",
  authenticate,
  companyOnly,
  uploadProjectImages,
  handleUploadError,
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("timeframe.startDate")
      .isISO8601()
      .withMessage("Start date must be a valid date"),
    body("timeframe.endDate")
      .isISO8601()
      .withMessage("End date must be a valid date")
      .custom((value, { req }) => {
        return new Date(value) > new Date(req.body.timeframe.startDate);
      })
      .withMessage("End date must be after start date"),
  ],
  createProject
);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectRequest'
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     project:
 *                       $ref: '#/components/schemas/Project'
 */
router.put(
  "/:id",
  authenticate,
  companyOnly,
  uploadProjectImages,
  handleUploadError,
  [
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Title cannot be empty"),
    body("description")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Description cannot be empty"),
    body("timeframe.startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid date"),
    body("timeframe.endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid date")
      .custom((value, { req }) => {
        if (req.body.timeframe && req.body.timeframe.startDate) {
          return new Date(value) > new Date(req.body.timeframe.startDate);
        }
        return true;
      })
      .withMessage("End date must be after start date"),
  ],
  updateProject
);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.delete("/:id", authenticate, companyOnly, deleteProject);

/**
 * @swagger
 * /api/projects/{id}/apply:
 *   post:
 *     summary: Apply to a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - coverLetter
 *             properties:
 *               coverLetter:
 *                 type: string
 *               submissionLink:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     application:
 *                       $ref: '#/components/schemas/Application'
 */
router.post(
  "/:id/apply",
  authenticate,
  juniorOnly,
  [
    body("coverLetter")
      .trim()
      .notEmpty()
      .withMessage("Cover letter is required"),
    body("submissionLink")
      .optional({ nullable: true })
      .isURL()
      .withMessage("Submission link must be a valid URL"),
  ],
  createApplication
);

/**
 * @swagger
 * /api/projects/{id}/like:
 *   post:
 *     summary: Toggle like on a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post("/:id/like", authenticate, toggleLike);

export default router;
