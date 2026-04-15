import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  name: string;
  email: string;
  passwordHash: string;
  authToken?: string | null;
  skills: string[];
  preferredTypes: string[];
  location: string;
  experienceLevel: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    authToken: {
      type: String,
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
    preferredTypes: {
      type: [String],
      enum: ["internship", "hackathon", "job"],
      default: [],
    },
    location: {
      type: String,
      required: true,
      default: "Remote",
    },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
      default: "beginner",
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
