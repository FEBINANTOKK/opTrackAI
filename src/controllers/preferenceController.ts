import { Request, Response } from "express";
import Preference from "../models/Preference.js";
import User from "../models/User.js";

const ALLOWED_REWARDS = new Set([
  "certificate",
  "cash_prize",
  "internship_offer",
  "job_offer",
  "swags",
  "experience",
]);

const ALLOWED_WORK_MODES = new Set(["Remote", "Onsite", "Hybrid"]);
const ALLOWED_TIME_COMMITMENTS = new Set([
  "1_day",
  "1_week",
  "2_weeks",
  "1_month",
  "long_term",
]);
const ALLOWED_OPPORTUNITY_TYPES = new Set(["hackathon", "internship", "job"]);

/** Coerce a value to a deduplicated array of trimmed, non-empty strings. */
const toStringArray = (value: unknown): string[] => {
  let items: string[];

  if (Array.isArray(value)) {
    items = value
      .filter((item) => typeof item === "string")
      .map((item) => (item as string).trim())
      .filter(Boolean);
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    items = trimmed ? [trimmed] : [];
  } else {
    return [];
  }

  // Remove duplicates while preserving order
  return [...new Set(items)];
};

type NormalizeResult =
  | { valid: true; data: Record<string, unknown> }
  | { valid: false; errors: string[] };

/**
 * Normalizes and strictly validates preference input.
 * - Converts string fields to arrays (backward compat)
 * - Removes duplicates and trims strings
 * - Returns 400-ready error list for any unrecognized enum values
 */
export const normalizePreferenceInput = (
  body: Record<string, unknown>,
): NormalizeResult => {
  const errors: string[] = [];

  const rewardInput = toStringArray(body.reward);
  const invalidRewards = rewardInput.filter((v) => !ALLOWED_REWARDS.has(v));
  if (invalidRewards.length > 0) {
    errors.push(
      `Invalid reward value(s): ${invalidRewards.join(", ")}. Allowed: ${[...ALLOWED_REWARDS].join(", ")}`,
    );
  }

  const workModeInput = toStringArray(body.workMode);
  const invalidWorkModes = workModeInput.filter(
    (v) => !ALLOWED_WORK_MODES.has(v),
  );
  if (invalidWorkModes.length > 0) {
    errors.push(
      `Invalid workMode value(s): ${invalidWorkModes.join(", ")}. Allowed: ${[...ALLOWED_WORK_MODES].join(", ")}`,
    );
  }

  const timeCommitmentInput = toStringArray(body.timeCommitment);
  const invalidTimeCommitments = timeCommitmentInput.filter(
    (v) => !ALLOWED_TIME_COMMITMENTS.has(v),
  );
  if (invalidTimeCommitments.length > 0) {
    errors.push(
      `Invalid timeCommitment value(s): ${invalidTimeCommitments.join(", ")}. Allowed: ${[...ALLOWED_TIME_COMMITMENTS].join(", ")}`,
    );
  }

  // Strip legacy "both" before validating opportunityType
  const opportunityTypeInput = toStringArray(body.opportunityType).filter(
    (v) => v !== "both",
  );
  const invalidOpportunityTypes = opportunityTypeInput.filter(
    (v) => !ALLOWED_OPPORTUNITY_TYPES.has(v),
  );
  if (invalidOpportunityTypes.length > 0) {
    errors.push(
      `Invalid opportunityType value(s): ${invalidOpportunityTypes.join(", ")}. Allowed: ${[...ALLOWED_OPPORTUNITY_TYPES].join(", ")}`,
    );
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const skillsInput = toStringArray(body.skills);

  const {
    userId,
    reward,
    workMode,
    timeCommitment,
    opportunityType,
    skills,
    ...rest
  } = body;

  return {
    valid: true,
    data: {
      ...rest,
      reward: rewardInput,
      workMode: workModeInput,
      timeCommitment: timeCommitmentInput,
      opportunityType: opportunityTypeInput,
      skills: skillsInput,
    },
  };
};

export const getPreference = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId =
      req.params.id || req.body.userId || (req.query.userId as string);

    if (!userId) {
      res.status(400).json({ error: "User ID is required." });
      return;
    }

    const preference = await Preference.findOne({ userId });

    if (!preference) {
      res.status(404).json({ error: "Preferences not found for this user." });
      return;
    }

    res.status(200).json({ preference });
  } catch (error) {
    console.error("Failed to get preferences:", error);
    res.status(500).json({ error: "Unable to fetch preferences." });
  }
};

export const upsertPreference = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId, ...preferenceData } = req.body as Record<string, unknown>;

    if (!userId) {
      res.status(400).json({ error: "User ID is required." });
      return;
    }

    const normalized = normalizePreferenceInput(preferenceData);
    if (!normalized.valid) {
      res
        .status(400)
        .json({
          error: "Invalid preference input.",
          details: normalized.errors,
        });
      return;
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const result = await Preference.findOneAndUpdate(
      { userId },
      { ...normalized.data, userId },
      {
        new: true,
        upsert: true,
        runValidators: true,
        includeResultMetadata: true,
      },
    );

    const isCreated = result.lastErrorObject?.updatedExisting === false;

    res.status(isCreated ? 201 : 200).json({
      message: isCreated
        ? "Preferences created successfully."
        : "Preferences updated successfully.",
      preference: result.value,
    });
  } catch (error) {
    console.error("Failed to save preferences:", error);
    res.status(500).json({ error: "Unable to save preferences right now." });
  }
};

export const getPreferenceByToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const token = authHeader.split(" ")[1];
    const user = await User.findOne({ authToken: token });

    if (!user) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const preference = await Preference.findOne({ userId: user._id });
    res.status(200).json({ preference });
  } catch (error) {
    console.error("Failed to get preferences by token:", error);
    res.status(500).json({ error: "Unable to fetch preferences." });
  }
};
