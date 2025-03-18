import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import {
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  submitWork
} from '../controllers/applicationController';

const router = express.Router();

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all applications (admin only)
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
 *         name: applicant
 *         schema:
 *           type: string
 *         description: Filter by applicant ID
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
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, authorize(['admin']), getApplications);

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Get application by ID
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
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticate, getApplicationById);

/**
 * @swagger
 * /api/applications/{id}:
 *   put:
 *     summary: Update application status (company only)
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
 *                 enum: [pending, accepted, rejected]
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  authenticate,
  [
    body('status')
      .isIn(['pending', 'accepted', 'rejected'])
      .withMessage('Status must be pending, accepted, or rejected'),
    body('feedback').optional(),
  ],
  updateApplication
);

/**
 * @swagger
 * /api/applications/{id}:
 *   delete:
 *     summary: Delete application (admin only)
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
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, authorize(['admin']), deleteApplication);

/**
 * @swagger
 * /api/applications/{id}/submit:
 *   put:
 *     summary: Submit work link for an accepted application
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
 *       400:
 *         description: Validation error or application not accepted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/submit',
  authenticate,
  [
    body('submissionLink')
      .isURL()
      .withMessage('Submission link must be a valid URL'),
  ],
  submitWork
);

export default router; 