import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User as UserType } from '@juniorhub/types';

// Define MongoDB schema-specific types
type MongooseUser = Omit<UserType, 'id' | 'projects' | 'applications'> & {
  projects?: mongoose.Types.ObjectId[];
  applications?: mongoose.Types.ObjectId[];
  googleId?: string;
  facebookId?: string;
  refreshToken?: string;
  // Junior specific fields
  portfolio?: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  // Company specific fields
  companyName?: string;
  website?: string;
  industry?: string;
};

// Create the document interface
export interface UserDocument extends MongooseUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  password?: string; // Add password to interface to fix TypeScript errors
}

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: function() {
        // Password is required unless the user is using OAuth
        return !this.googleId && !this.facebookId;
      },
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['junior', 'company', 'admin'],
      required: [true, 'Role is required'],
    },
    profilePicture: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    projects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
    applications: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Application',
      },
    ],
    // OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined values (for users not using Google)
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined values (for users not using Facebook)
    },
    refreshToken: {
      type: String,
      select: false, // Don't return refreshToken by default
    },
    // Junior specific fields
    portfolio: {
      type: [String],
      default: [],
      validate: {
        validator: function(this: UserDocument) {
          return this.role !== 'junior' || (this.portfolio ? true : false);
        },
        message: 'Portfolio should be an array of URLs'
      }
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      validate: {
        validator: function(this: UserDocument) {
          return this.role !== 'junior' || (this.experienceLevel ? true : false);
        },
        message: 'Experience level is required for junior users'
      }
    },
    // Company specific fields
    companyName: {
      type: String,
      validate: {
        validator: function(this: UserDocument) {
          return this.role !== 'company' || (this.companyName ? true : false);
        },
        message: 'Company name is required for company users'
      }
    },
    website: {
      type: String,
      validate: {
        validator: function(this: UserDocument, v: string) {
          if (!v || this.role !== 'company') return true;
          return /^(https?:\/\/)([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(v);
        },
        message: 'Please provide a valid website URL'
      }
    },
    industry: {
      type: String,
      validate: {
        validator: function(this: UserDocument) {
          return this.role !== 'company' || (this.industry ? true : false);
        },
        message: 'Industry is required for company users'
      }
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  const user = this;

  // Only hash the password if it has been modified or is new AND if it exists
  if (!user.isModified('password') || !user.password) return next();

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model<UserDocument>('User', UserSchema);

export default User; 