import mongoose, { Document, Schema } from 'mongoose';
import { Project as ProjectType } from '@juniorhub/types';
import User from './User';

// Define MongoDB schema-specific types (replacing string IDs with ObjectIds)
type MongooseProject = Omit<ProjectType, 'id' | 'company' | 'applications' | 'selectedDeveloper'> & {
  company: mongoose.Types.ObjectId;
  applications?: mongoose.Types.ObjectId[];
  selectedDeveloper?: mongoose.Types.ObjectId;
  isAcceptingApplications: boolean;
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
      validate: {
        validator: async function(this: ProjectDocument, value: mongoose.Types.ObjectId) {
          // Ensure the company is a company user
          const company = await User.findById(value);
          return company?.role === 'company' || company?.role === 'admin';
        },
        message: 'Only company users can own projects'
      }
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
    applications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
      },
    ],
    selectedDeveloper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: async function(this: ProjectDocument, value: mongoose.Types.ObjectId) {
          if (!value) return true; // Allow null/undefined
          // Ensure the selected developer is a junior user
          const developer = await User.findById(value);
          return developer?.role === 'junior';
        },
        message: 'Only junior users can be selected as developers'
      }
    },
    tags: {
      type: [String],
      default: [],
    },
    likes: {
      type: Number,
      default: 0,
    },
    isAcceptingApplications: {
      type: Boolean,
      default: true,
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
  return this.applications ? this.applications.length : 0;
});

// Add a method to check if a project is still accepting applications
// ProjectSchema.methods.isAcceptingApplications = function(): boolean {
//   return this.status === 'open' && new Date() < this.timeframe.endDate;
// };

const Project = mongoose.model<ProjectDocument>('Project', ProjectSchema);

export default Project; 