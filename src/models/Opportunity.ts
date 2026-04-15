import mongoose, { Document, Schema } from "mongoose";

export interface IOpportunity extends Document {
  title: string;
  company: string;
  skills: string[];
  location: string;
  type: string;
  deadline: Date;
  reward?: string;
  source: string;
  link: string;
  createdAt: Date;
  updatedAt: Date;
}

const oppurtunitySchema = new Schema<IOpportunity>(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      index: true,
    },
    skills: {
      type: [String],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["internship", "hackathon", "job"],
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    reward: {
      type: String,
      required: false,
    },
    source: {
      type: String,
      required: true,
      index: true,
    },
    link: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

const Opportunity = mongoose.model<IOpportunity>(
  "Opportunity",
  oppurtunitySchema,
);

export default Opportunity;
