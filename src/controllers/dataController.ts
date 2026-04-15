import { Request, Response } from "express";
import User from "../models/User.js";
import Opportunity from "../models/Opportunity.js";

export const getAllData = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [users, opportunities] = await Promise.all([
      User.find(),
      Opportunity.find(),
    ]);

    res.status(200).json({
      success: true,
      counts: {
        users: users.length,
        opportunities: opportunities.length,
      },
      data: {
        users,
        opportunities,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch all data" });
  }
};
