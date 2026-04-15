import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  skills: string[];
  preferredTypes: string[];
  location: string;
  experienceLevel: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    skills: {
      type: [String],
      required: true,
      default: [],
    },
    preferredTypes: {
      type: [String],
      enum: ["internship", "hackathon", "job"],
      required: true,
      default: [],
    },
    location: {
      type: String,
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
