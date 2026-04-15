import { Request, Response } from "express";
import Opportunity from "../models/Opportunity.js";
import User from "../models/User.js";
import { rankOpportunities } from "../services/recommendationEngine.js";

export const getOpportunitiesFeed = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Fetch all opportunities
    const opportunities = await Opportunity.find();

    // Rank opportunities based on user preferences
    const rankedOpportunities = rankOpportunities(opportunities, user);

    res.status(200).json({
      success: true,
      count: rankedOpportunities.length,
      feed: rankedOpportunities,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch opportunities feed" });
  }
};

export const getAllOpportunities = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const opportunities = await Opportunity.find();
    res.status(200).json({
      success: true,
      count: opportunities.length,
      opportunities,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch opportunities" });
  }
};

export const createOpportunity = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      title,
      company,
      skills,
      location,
      type,
      deadline,
      reward,
      source,
      link,
    } = req.body;

    const opportunity = new Opportunity({
      title,
      company,
      skills,
      location,
      type,
      deadline,
      reward,
      source,
      link,
    });

    await opportunity.save();

    res.status(201).json({
      success: true,
      message: "Opportunity created",
      opportunity,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create opportunity" });
  }
};

export const getOpportunityById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const opportunity = await Opportunity.findById(id);

    if (!opportunity) {
      res.status(404).json({ error: "Opportunity not found" });
      return;
    }

    res.status(200).json({
      success: true,
      opportunity,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch opportunity" });
  }
};

export const deleteOpportunity = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const opportunity = await Opportunity.findByIdAndDelete(id);

    if (!opportunity) {
      res.status(404).json({ error: "Opportunity not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Opportunity deleted",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete opportunity" });
  }
};
