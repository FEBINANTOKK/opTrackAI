import { Request, Response } from "express";

import { runAllScrapers } from "../services/scrapers/index.js";

export const runAllScrapersHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await runAllScrapers();

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to run scrapers",
    });
  }
};
