import express from "express";
import { authenticate } from "../middleware/auth";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController";
import { SwaggerPathsType } from "../types/swagger";

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

const router = express.Router();

router.get("/", authenticate, getNotifications);
router.put("/:id/read", authenticate, markAsRead);
router.put("/mark-all-read", authenticate, markAllAsRead);
router.delete("/:id", authenticate, deleteNotification);

export default router;
