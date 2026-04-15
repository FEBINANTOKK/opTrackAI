import { Request, Response } from "express";
import Preference from "../models/Preference.js";
import User from "../models/User.js";

export const getPreference = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.body.userId || (req.query.userId as string);

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

export const upsertPreference = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, ...preferenceData } = req.body;

    if (!userId) {
      res.status(400).json({ error: "User ID is required." });
      return;
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const preference = await Preference.findOneAndUpdate(
      { userId },
      { ...preferenceData, userId },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: "Preferences saved successfully.",
      preference,
    });
  } catch (error) {
    console.error("Failed to save preferences:", error);
    res.status(500).json({ error: "Unable to save preferences right now." });
  }
};

export const getPreferenceByToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const token = authHeader.split(' ')[1];
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
}
