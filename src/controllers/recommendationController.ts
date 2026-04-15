import { Request, Response } from "express";
import { getRecommendations as getRecommendationsService } from "../services/recommendationService.js";

const parsePositiveInteger = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseNonNegativeNumber = (value: unknown, fallback: number): number => {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const getRecommendations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: "User ID is required." });
      return;
    }

    const limit = parsePositiveInteger(req.query.limit, 20);
    const minScore = parseNonNegativeNumber(req.query.minScore, 0);

    const result = await getRecommendationsService(userId, {
      limit,
      minScore,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to get recommendations:", error);
    res.status(500).json({ error: "Unable to fetch recommendations." });
  }
};
