import mongoose, { Document, Schema } from 'mongoose';

export interface NotificationDocument extends Document {
  user: mongoose.Types.ObjectId;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  relatedTo?: {
    model: 'Project' | 'Application' | 'User';
    id: mongoose.Types.ObjectId;
  };
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    relatedTo: {
      model: {
        type: String,
        enum: ['Project', 'Application', 'User'],
      },
      id: {
        type: Schema.Types.ObjectId,
      },
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for user and read status for better query performance
NotificationSchema.index({ user: 1, read: 1 });

// Create index for createdAt to allow for efficient time-based queries and sorting
NotificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model<NotificationDocument>('Notification', NotificationSchema);

export default Notification; 