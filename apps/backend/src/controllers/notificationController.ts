import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification';

/**
 * Get user's notifications
 * @route GET /api/notifications
 * @access Private
 */
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { read, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build query
    const query: any = { user: userId };

    // Filter by read status if provided
    if (read !== undefined) {
      query.read = read === 'true';
    }

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      data: notifications,
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Mark notification as read
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid notification ID',
      });
      return;
    }

    // Find and update notification
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({
        success: false,
        error: 'Notification not found or does not belong to the user',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Mark all notifications as read
 * @route PUT /api/notifications/read-all
 * @access Private
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;

    // Update all unread notifications for the user
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
    });
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Delete a notification
 * @route DELETE /api/notifications/:id
 * @access Private
 */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid notification ID',
      });
      return;
    }

    // Find and delete notification
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      res.status(404).json({
        success: false,
        error: 'Notification not found or does not belong to the user',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Create a notification (internal use)
 * @param userId - ID of the user to receive the notification
 * @param message - Notification message
 * @param type - Notification type (info, success, warning, error)
 * @param relatedTo - Optional related model and ID
 * @returns The created notification
 */
export const createNotification = async (
  userId: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  relatedTo?: {
    model: 'Project' | 'Application' | 'User';
    id: string;
  }
) => {
  try {
    const notification = new Notification({
      user: userId,
      message,
      type,
      relatedTo: relatedTo
        ? {
            model: relatedTo.model,
            id: relatedTo.id,
          }
        : undefined,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}; 