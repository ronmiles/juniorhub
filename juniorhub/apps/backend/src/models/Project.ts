import mongoose, { Document, Schema } from 'mongoose';
import { Project as ProjectType } from '@juniorhub/types';

// Define MongoDB schema-specific types (replacing string IDs with ObjectIds)
type MongooseProject = Omit<ProjectType, 'id' | 'company' | 'applicants' | 'selectedDeveloper'> & {
  company: mongoose.Types.ObjectId;
  applicants?: mongoose.Types.ObjectId[];
  selectedDeveloper?: mongoose.Types.ObjectId;
};

// Create the document interface
export interface ProjectDocument extends MongooseProject, Document {}

const ProjectSchema = new Schema<ProjectDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Company is required'],
    },
    requirements: {
      type: [String],
      default: [],
    },
    timeframe: {
      startDate: {
        type: Date,
        required: [true, 'Start date is required'],
      },
      endDate: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
          validator: function(this: ProjectDocument, value: Date) {
            return value > this.timeframe.startDate;
          },
          message: 'End date must be after start date',
        },
      },
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'canceled'],
      default: 'open',
    },
    skillsRequired: {
      type: [String],
      default: [],
    },
    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    selectedDeveloper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: {
      type: [String],
      default: [],
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

// Create index for search functionality
ProjectSchema.index({ title: 'text', description: 'text', tags: 'text', skillsRequired: 'text' });

// Adding a virtual field for calculating application count
ProjectSchema.virtual('applicationCount').get(function(this: ProjectDocument) {
  return this.applicants ? this.applicants.length : 0;
});

// Add a method to check if a project is still accepting applications
ProjectSchema.methods.isAcceptingApplications = function(): boolean {
  return this.status === 'open' && new Date() < this.timeframe.endDate;
};

const Project = mongoose.model<ProjectDocument>('Project', ProjectSchema);

export default Project; 