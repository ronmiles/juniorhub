import express, { Router } from "express";
import { enhanceProject } from "../controllers/aiController";
import { authenticate, authorize, companyOnly } from "../middleware/auth";
import { SwaggerPathsType } from "../types/swagger";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI enhancement features
 */

export const aiPaths: SwaggerPathsType = {
  "/api/ai/enhance-profile": {
    post: {
      summary: "Enhance user profile with AI",
      tags: ["AI"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                currentBio: {
                  type: "string",
                },
                skills: {
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
          description: "Enhanced profile content",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  enhancedBio: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/ai/enhance-project": {
    post: {
      summary: "Enhance project details using AI",
      tags: ["AI"],
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
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Enhanced project content",
        },
      },
    },
  },
  "/api/ai/generate-cover-letter": {
    post: {
      summary: "Generate a cover letter with AI",
      tags: ["AI"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId"],
              properties: {
                projectId: {
                  type: "string",
                },
                userSkills: {
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
          description: "Generated cover letter",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  coverLetter: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

/**
 * @swagger
 * /api/ai/enhance-project:
 *   post:
 *     summary: Enhance project details using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 description: Project title
 *               description:
 *                 type: string
 *                 description: Project description
 *     responses:
 *       200:
 *         description: Enhanced project details
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
 *                     enhancedDescription:
 *                       type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     requiredSkills:
 *                       type: array
 *                       items:
 *                         type: string
 *                     experienceLevel:
 *                       type: string
 *       400:
 *         description: Missing title or description
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be a company)
 *       500:
 *         description: Server error
 */
router.post(
  "/enhance-project",
  authenticate,
  authorize(["company", "admin"]),
  companyOnly,
  enhanceProject
);

/**
 * @swagger
 * /api/ai/enhance-profile:
 *   post:
 *     summary: Enhance user profile with AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentBio:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Enhanced profile content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enhancedBio:
 *                   type: string
 */
// router.post('/enhance-profile', ...

/**
 * @swagger
 * /api/ai/generate-cover-letter:
 *   post:
 *     summary: Generate a cover letter with AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *             properties:
 *               projectId:
 *                 type: string
 *               userSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Generated cover letter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coverLetter:
 *                   type: string
 */
// router.post('/generate-cover-letter', ...

export default router;
