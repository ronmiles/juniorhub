import express, { Router } from "express";
import { enhanceProject } from "../controllers/aiController";
import { authenticate, authorize, companyOnly } from "../middleware/auth";
import { SwaggerPathsType } from "../types/swagger";

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

const router: Router = express.Router();

router.post(
  "/enhance-project",
  authenticate,
  authorize(["company", "admin"]),
  companyOnly,
  enhanceProject
);

export default router;
