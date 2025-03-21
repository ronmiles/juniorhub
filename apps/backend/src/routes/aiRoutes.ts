import express, { Router } from "express";
import { enhanceProject } from "../controllers/aiController";
import { authenticate, authorize, companyOnly } from "../middleware/auth";

const router: Router = express.Router();

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

export default router;
