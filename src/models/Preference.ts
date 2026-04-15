import mongoose, { Document, Schema } from "mongoose";

const REWARD_VALUES = [
  "certificate",
  "cash_prize",
  "internship_offer",
  "job_offer",
  "swags",
  "experience",
] as const;

const WORK_MODE_VALUES = ["Remote", "Onsite", "Hybrid"] as const;

const TIME_COMMITMENT_VALUES = [
  "1_day",
  "1_week",
  "2_weeks",
  "1_month",
  "long_term",
] as const;

const OPPORTUNITY_TYPE_VALUES = ["hackathon", "internship", "job"] as const;

type RewardValue = (typeof REWARD_VALUES)[number];
type WorkModeValue = (typeof WORK_MODE_VALUES)[number];
type TimeCommitmentValue = (typeof TIME_COMMITMENT_VALUES)[number];
type OpportunityTypeValue = (typeof OPPORTUNITY_TYPE_VALUES)[number];

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
};

const normalizeLegacyPreferenceShape = (
  target: Record<string, unknown>,
): void => {
  if (Object.prototype.hasOwnProperty.call(target, "reward")) {
    target.reward = toStringArray(target.reward);
  }

  if (Object.prototype.hasOwnProperty.call(target, "workMode")) {
    target.workMode = toStringArray(target.workMode);
  }

  if (Object.prototype.hasOwnProperty.call(target, "timeCommitment")) {
    target.timeCommitment = toStringArray(target.timeCommitment);
  }

  if (Object.prototype.hasOwnProperty.call(target, "opportunityType")) {
    target.opportunityType = toStringArray(target.opportunityType).filter(
      (value) => value !== "both",
    );
  }
};

export interface IPreference extends Document {
  userId: mongoose.Types.ObjectId;
  target: "student" | "job seeker";
  reward: RewardValue[];
  college?: string;
  year?: string;
  location: string;
  workMode: WorkModeValue[];
  timeCommitment: TimeCommitmentValue[];
  opportunityType: OpportunityTypeValue[];
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
      type: [
        {
          type: String,
          enum: REWARD_VALUES,
          trim: true,
        },
      ],
      default: [],
      index: true,
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
      type: [
        {
          type: String,
          enum: WORK_MODE_VALUES,
          trim: true,
        },
      ],
      default: [],
      index: true,
    },
    timeCommitment: {
      type: [
        {
          type: String,
          enum: TIME_COMMITMENT_VALUES,
          trim: true,
        },
      ],
      default: [],
    },
    opportunityType: {
      type: [
        {
          type: String,
          enum: OPPORTUNITY_TYPE_VALUES,
          trim: true,
        },
      ],
      default: [],
      index: true,
    },
    skills: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

preferenceSchema.pre("save", function (next) {
  normalizeLegacyPreferenceShape(this as unknown as Record<string, unknown>);
  next();
});

preferenceSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (!update || typeof update !== "object") {
    next();
    return;
  }

  const updateObject = update as Record<string, unknown>;
  normalizeLegacyPreferenceShape(updateObject);

  const setObject = updateObject.$set as Record<string, unknown> | undefined;
  if (setObject && typeof setObject === "object") {
    normalizeLegacyPreferenceShape(setObject);
  }

  this.setUpdate(updateObject);
  next();
});

preferenceSchema.index({ userId: 1 }, { unique: true });
const Preference = mongoose.model<IPreference>("Preference", preferenceSchema);

export default Preference;
