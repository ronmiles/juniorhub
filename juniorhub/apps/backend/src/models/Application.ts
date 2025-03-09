import mongoose, { Document, Schema } from 'mongoose';
import { Application as ApplicationType } from '@juniorhub/types';

// Define MongoDB schema-specific types (replacing string IDs with ObjectIds)
type MongooseApplication = Omit<ApplicationType, 'id' | 'project' | 'applicant'> & {
  project: mongoose.Types.ObjectId;
  applicant: mongoose.Types.ObjectId;
};

// Create the document interface
export interface ApplicationDocument extends MongooseApplication, Document {}

const ApplicationSchema = new Schema<ApplicationDocument>(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Applicant is required'],
    },
    coverLetter: {
      type: String,
      required: [true, 'Cover letter is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    submissionLink: {
      type: String,
      validate: {
        validator: function (value: string) {
          // Simple URL validation
          return /^(http|https):\/\/[^ "]+$/.test(value);
        },
        message: 'Please provide a valid URL',
      },
    },
    feedback: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

// Ensure a user can only apply once to a project
ApplicationSchema.index({ project: 1, applicant: 1 }, { unique: true });

const Application = mongoose.model<ApplicationDocument>('Application', ApplicationSchema);

export default Application; 