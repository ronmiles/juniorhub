import mongoose, { Document, Schema } from "mongoose";
import { Comment as CommentType } from "@juniorhub/types";
import User from "./User";
import Project from "./Project";

// Define MongoDB schema-specific types
type MongooseComment = Omit<CommentType, "id" | "project" | "author"> & {
  project: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
};

// Create the document interface
export interface CommentDocument extends MongooseComment, Document {}

const CommentSchema = new Schema<CommentDocument>(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
      validate: {
        validator: async function (
          this: CommentDocument,
          value: mongoose.Types.ObjectId
        ) {
          // Ensure the project exists
          const project = await Project.findById(value);
          return !!project;
        },
        message: "Project must exist",
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      validate: {
        validator: async function (
          this: CommentDocument,
          value: mongoose.Types.ObjectId
        ) {
          // Ensure the author exists
          const author = await User.findById(value);
          return !!author;
        },
        message: "Author must exist",
      },
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      maxlength: [2000, "Comment content cannot exceed 2000 characters"],
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

const Comment = mongoose.model<CommentDocument>("Comment", CommentSchema);

export default Comment;
