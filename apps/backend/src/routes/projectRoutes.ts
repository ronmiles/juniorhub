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

router.get("/", optionalAuthenticate, getProjects);
router.get("/:id", optionalAuthenticate, getProjectById);
router.get(
  "/:id/applications",
  authenticate,
  companyOnly,
  getProjectApplications
);
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
    body("skills").isArray().withMessage("Skills must be an array"),
  ],
  createProject
);
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
router.delete("/:id", authenticate, companyOnly, deleteProject);
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
router.post("/:id/like", authenticate, toggleLike);

export default router;
