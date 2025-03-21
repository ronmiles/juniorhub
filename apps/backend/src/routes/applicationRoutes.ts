import express from "express";
import { body } from "express-validator";
import {
  authenticate,
  authorize,
  juniorOnly,
  companyOnly,
} from "../middleware/auth";
import {
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  submitWork,
} from "../controllers/applicationController";

const router = express.Router();

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get applications for the authenticated user
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *         description: Filter by application status
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filter by project ID
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
 *         description: List of applications
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
router.get("/", authenticate, getApplications);

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Get an application by ID
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application details
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
router.get("/:id", authenticate, getApplicationById);

/**
 * @swagger
 * /api/applications/{id}:
 *   patch:
 *     summary: Update an application status (approve/reject)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application status updated successfully
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
router.patch(
  "/:id",
  authenticate,
  companyOnly,
  [
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["approved", "rejected"])
      .withMessage("Status must be either approved or rejected"),
    body("feedback").optional().trim(),
  ],
  updateApplication
);

/**
 * @swagger
 * /api/applications/{id}:
 *   put:
 *     summary: Update an application (company can change status, junior can withdraw)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected]
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application updated successfully
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
router.put(
  "/:id",
  authenticate,
  [
    body("status")
      .optional()
      .isIn(["pending", "accepted", "rejected"])
      .withMessage("Invalid status value"),
    body("feedback").optional().trim(),
  ],
  updateApplication
);

/**
 * @swagger
 * /api/applications/{id}:
 *   delete:
 *     summary: Delete an application (withdraw application)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application deleted successfully
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
router.delete("/:id", authenticate, juniorOnly, deleteApplication);

/**
 * @swagger
 * /api/applications/{id}/submit:
 *   post:
 *     summary: Submit work for an accepted application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - submissionLink
 *             properties:
 *               submissionLink:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Work submitted successfully
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
  "/:id/submit",
  authenticate,
  juniorOnly,
  [
    body("submissionLink")
      .isURL()
      .withMessage("Submission link must be a valid URL"),
  ],
  submitWork
);

export default router;
