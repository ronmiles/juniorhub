import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';
import { SwaggerPathsType } from '../types/swagger';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notifications
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         message:
 *           type: string
 *         type:
 *           type: string
 *           enum: [application, message, system]
 *         read:
 *           type: boolean
 *         relatedId:
 *           type: string
 *           description: ID related to the notification (e.g. application ID)
 *         createdAt:
 *           type: string
 *           format: date-time
 */

export const notificationPaths: SwaggerPathsType = {
  "/api/notifications": {
    get: {
      summary: "Get user notifications",
      tags: ["Notifications"],
      parameters: [
        {
          in: "query",
          name: "unreadOnly",
          schema: {
            type: "boolean",
          },
          description: "Filter to unread notifications only",
        },
      ],
      responses: {
        "200": {
          description: "List of notifications",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/Notification",
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/notifications/{id}/read": {
    put: {
      summary: "Mark a notification as read",
      tags: ["Notifications"],
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
          description: "Notification marked as read",
        },
        "404": {
          description: "Notification not found",
        },
      },
    },
  },
  "/api/notifications/mark-all-read": {
    put: {
      summary: "Mark all notifications as read",
      tags: ["Notifications"],
      responses: {
        "200": {
          description: "All notifications marked as read",
        },
      },
    },
  },
  "/api/notifications/{id}": {
    delete: {
      summary: "Delete a notification",
      tags: ["Notifications"],
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
          description: "Notification deleted successfully",
        },
        "404": {
          description: "Notification not found",
        },
      },
    },
  },
};

export const notificationComponents = {
  schemas: {
    Notification: {
      type: "object",
      properties: {
        id: {
          type: "string",
        },
        userId: {
          type: "string",
        },
        message: {
          type: "string",
        },
        type: {
          type: "string",
          enum: ["application", "message", "system"],
        },
        read: {
          type: "boolean",
        },
        relatedId: {
          type: "string",
          description: "ID related to the notification (e.g. application ID)",
        },
        createdAt: {
          type: "string",
          format: "date-time",
        },
      },
    },
  },
};

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Filter to unread notifications only
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get('/', authenticate, getNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.put('/:id/read', authenticate, markAsRead);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/mark-all-read', authenticate, markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Notification not found or does not belong to the user
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, deleteNotification);

export default router; 