import { Request, Response } from "express";
import Opportunity from "../models/Opportunity.js";
import { getRecommendationsForUser } from "../services/recommendationService.js";

export const getOpportunitiesFeed = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: "User ID is required." });
      return;
    }

    const limit = Number.parseInt(String(req.query.limit ?? "20"), 10);
    const minScore = Number.parseFloat(String(req.query.minScore ?? "0"));

    const recommendations = await getRecommendationsForUser(userId, {
      limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
      minScore: Number.isFinite(minScore) && minScore >= 0 ? minScore : 0,
    });

    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch opportunities feed" });
  }
};

export const getAllOpportunities = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const limit = Number.parseInt(String(req.query.limit ?? "10"), 10);
    const page = Number.parseInt(String(req.query.page ?? "1"), 10);
    const skip = (page - 1) * limit;

    const total = await Opportunity.countDocuments();
    const opportunities = await Opportunity.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: opportunities.length,
      total,
      hasMore: skip + opportunities.length < total,
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
