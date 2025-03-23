import express from "express";
import { body } from "express-validator";
import { authenticate, authorize, authorizeOwn } from "../middleware/auth";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserProjects,
  getUserApplications,
  uploadProfilePicture,
  deleteUserProfilePicture,
} from "../controllers/userController";
import {
  uploadProfilePicture as uploadMiddleware,
  handleUploadError,
} from "../middleware/uploadMiddleware";
import { SwaggerPathsType } from "../types/swagger";

export const userPaths: SwaggerPathsType = {
  "/api/users": {
    get: {
      summary: "Get all users (admin only)",
      tags: ["Users"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: "query",
          name: "role",
          schema: {
            type: "string",
            enum: ["junior", "company", "admin"],
          },
          description: "Filter by user role",
        },
        {
          in: "query",
          name: "search",
          schema: {
            type: "string",
          },
          description: "Search by name or email",
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
          description: "List of users",
        },
        "401": {
          description: "Not authenticated",
        },
        "403": {
          description: "Not authorized",
        },
        "500": {
          description: "Server error",
        },
      },
    },
  },
  "/api/users/{id}": {
    get: {
      summary: "Get user by ID",
      tags: ["Users"],
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
          description: "User details",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/User",
              },
            },
          },
        },
        "404": {
          description: "User not found",
        },
      },
    },
    put: {
      summary: "Update user",
      tags: ["Users"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string",
          },
          description: "User ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                bio: {
                  type: "string",
                },
                skills: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "List of skills (max 10)",
                },
                profilePicture: {
                  type: "string",
                },
                experienceLevel: {
                  type: "string",
                  enum: ["beginner", "intermediate", "advanced"],
                  description: "User's experience level (junior only)",
                },
                portfolio: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "List of portfolio links (max 5, junior only)",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "User updated successfully",
        },
        "400": {
          description: "Validation error",
        },
        "401": {
          description: "Not authenticated",
        },
        "403": {
          description: "Not authorized",
        },
        "404": {
          description: "User not found",
        },
        "500": {
          description: "Server error",
        },
      },
    },
    delete: {
      summary: "Delete user (admin only)",
      tags: ["Users"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string",
          },
          description: "User ID",
        },
      ],
      responses: {
        "200": {
          description: "User deleted successfully",
        },
        "401": {
          description: "Not authenticated",
        },
        "403": {
          description: "Not authorized",
        },
        "404": {
          description: "User not found",
        },
        "500": {
          description: "Server error",
        },
      },
    },
  },
  "/api/users/{id}/projects": {
    get: {
      summary: "Get user's projects",
      tags: ["Users"],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string",
          },
          description: "User ID",
        },
      ],
      responses: {
        "200": {
          description: "List of user's projects",
        },
        "404": {
          description: "User not found",
        },
        "500": {
          description: "Server error",
        },
      },
    },
  },
  "/api/users/{id}/applications": {
    get: {
      summary: "Get user's applications",
      tags: ["Users"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string",
          },
          description: "User ID",
        },
      ],
      responses: {
        "200": {
          description: "List of user's applications",
        },
        "401": {
          description: "Not authenticated",
        },
        "403": {
          description: "Not authorized",
        },
        "404": {
          description: "User not found",
        },
        "500": {
          description: "Server error",
        },
      },
    },
  },
  "/api/users/{id}/profile-picture": {
    post: {
      summary: "Upload profile picture",
      tags: ["Users"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string",
          },
          description: "User ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                profilePicture: {
                  type: "string",
                  format: "binary",
                  description: "Profile picture (JPEG, PNG, or WebP, max 5MB)",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Profile picture uploaded successfully",
        },
        "400": {
          description: "Validation error or file error",
        },
        "401": {
          description: "Not authenticated",
        },
        "403": {
          description: "Not authorized",
        },
        "404": {
          description: "User not found",
        },
        "500": {
          description: "Server error",
        },
      },
    },
    delete: {
      summary: "Delete profile picture",
      tags: ["Users"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string",
          },
          description: "User ID",
        },
      ],
      responses: {
        "200": {
          description: "Profile picture removed successfully",
        },
        "401": {
          description: "Not authenticated",
        },
        "403": {
          description: "Not authorized",
        },
        "404": {
          description: "User not found",
        },
        "500": {
          description: "Server error",
        },
      },
    },
  },
};

export const userComponents = {
  schemas: {
    User: {
      type: "object",
      properties: {
        id: {
          type: "string",
        },
        name: {
          type: "string",
        },
        email: {
          type: "string",
        },
        bio: {
          type: "string",
        },
        skills: {
          type: "array",
          items: {
            type: "string",
          },
        },
        avatar: {
          type: "string",
        },
        createdAt: {
          type: "string",
          format: "date-time",
        },
      },
    },
  },
};

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         bio:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         avatar:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [junior, company, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get("/", authenticate, authorize(["admin"]), getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get("/:id", getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of skills (max 10)
 *               profilePicture:
 *                 type: string
 *               experienceLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 description: User's experience level (junior only)
 *               portfolio:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of portfolio links (max 5, junior only)
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id",
  authenticate,
  authorizeOwn,
  [
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("bio").optional(),
    body("skills")
      .optional()
      .isArray()
      .withMessage("Skills must be an array")
      .custom((value) => {
        if (value && value.length > 10) {
          throw new Error("Maximum 10 skills allowed");
        }
        return true;
      }),
    body("profilePicture")
      .optional()
      .custom((value) => {
        // Allow empty string or null, or validate as URL
        if (!value || value === "") {
          return true;
        }
        // Simple URL regex to validate
        const urlPattern = new RegExp(
          "^(https?:\\/\\/)?" + // protocol
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
            "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
            "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
            "(\\#[-a-z\\d_]*)?$",
          "i"
        ); // fragment locator
        return urlPattern.test(value) || new Error("Must be a valid URL");
      })
      .withMessage("Profile picture must be a valid URL"),
    body("experienceLevel")
      .optional()
      .isIn(["beginner", "intermediate", "advanced"])
      .withMessage(
        "Experience level must be beginner, intermediate, or advanced"
      ),
    body("portfolio")
      .optional()
      .isArray()
      .withMessage("Portfolio must be an array")
      .custom((value) => {
        if (value && value.length > 5) {
          throw new Error("Maximum 5 portfolio links allowed");
        }
        return true;
      }),
    body("portfolio.*")
      .optional()
      .custom((value) => {
        // Allow empty string or null, or validate as URL
        if (!value || value === "") {
          return true;
        }
        // Simple URL regex to validate
        const urlPattern = new RegExp(
          "^(https?:\\/\\/)?" + // protocol
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
            "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
            "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
            "(\\#[-a-z\\d_]*)?$",
          "i"
        ); // fragment locator
        return urlPattern.test(value) || new Error("Must be a valid URL");
      })
      .withMessage("Portfolio links must be valid URLs"),
  ],
  updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authenticate, authorize(["admin"]), deleteUser);

/**
 * @swagger
 * /api/users/{id}/projects:
 *   get:
 *     summary: Get user's projects
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of user's projects
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/:id/projects", getUserProjects);

/**
 * @swagger
 * /api/users/{id}/applications:
 *   get:
 *     summary: Get user's applications
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of user's applications
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get(
  "/:id/applications",
  authenticate,
  authorizeOwn,
  getUserApplications
);

/**
 * @swagger
 * /api/users/{id}/profile-picture:
 *   post:
 *     summary: Upload profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture (JPEG, PNG, or WebP, max 5MB)
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *       400:
 *         description: Validation error or file error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post(
  "/:id/profile-picture",
  authenticate,
  authorizeOwn,
  uploadMiddleware,
  handleUploadError,
  uploadProfilePicture
);

/**
 * @swagger
 * /api/users/{id}/profile-picture:
 *   delete:
 *     summary: Delete profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Profile picture removed successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id/profile-picture",
  authenticate,
  authorizeOwn,
  deleteUserProfilePicture
);

export default router;
