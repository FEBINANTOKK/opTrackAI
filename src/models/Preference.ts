import mongoose, { Document, Schema } from "mongoose";

export interface IPreference extends Document {
  userId: mongoose.Types.ObjectId;
  target: "student" | "job seeker";
  reward: string;
  college?: string;
  year?: string;
  location: string;
  workMode: "Remote" | "Onsite" | "Hybrid";
  timeCommitment: string;
  opportunityType: "hackathon" | "internship" | "job" | "both";
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

const preferenceSchema = new Schema<IPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    target: {
      type: String,
      enum: ["student", "job seeker"],
      required: true,
      default: "student",
    },
    reward: {
      type: String,
      default: "",
    },
    college: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      default: "Remote",
    },
    workMode: {
      type: String,
      enum: ["Remote", "Onsite", "Hybrid"],
      required: true,
      default: "Remote",
    },
    timeCommitment: {
      type: String,
      default: "1 week",
    },
    opportunityType: {
      type: String,
      enum: ["hackathon", "internship", "job", "both"],
      required: true,
      default: "both",
    },
    skills: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Preference = mongoose.model<IPreference>("Preference", preferenceSchema);

export default Preference;
