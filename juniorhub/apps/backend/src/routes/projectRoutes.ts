import express from 'express';
import { body } from 'express-validator';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectsController';
import { createApplication } from '../controllers/applicationController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

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
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of projects
 *       500:
 *         description: Server error
 */
router.get('/', getProjects);

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
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getProjectById);

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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - timeframe
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
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authenticate,
  authorize(['company']),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('timeframe.startDate')
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    body('timeframe.endDate')
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.timeframe.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
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
 *               status:
 *                 type: string
 *                 enum: [open, in-progress, completed, canceled]
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  authenticate,
  [
    body('timeframe.startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    body('timeframe.endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom((value, { req }) => {
        if (
          req.body.timeframe?.startDate &&
          new Date(value) <= new Date(req.body.timeframe.startDate)
        ) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    body('status')
      .optional()
      .isIn(['open', 'in-progress', 'completed', 'canceled'])
      .withMessage('Invalid status value'),
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
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, deleteProject);

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
 *                 minLength: 50
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Validation error or already applied
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be 'junior' role)
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/apply',
  authenticate,
  authorize(['junior']),
  [
    body('coverLetter')
      .isLength({ min: 50, max: 1000 })
      .withMessage('Cover letter must be between 50 and 1000 characters'),
  ],
  createApplication
);

export default router; 