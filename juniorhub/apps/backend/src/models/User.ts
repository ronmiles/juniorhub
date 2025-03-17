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
};

// Create the document interface
export interface UserDocument extends MongooseUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
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