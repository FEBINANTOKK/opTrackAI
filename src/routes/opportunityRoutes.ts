import { Router } from "express";
import {
  getOpportunitiesFeed,
  getAllOpportunities,
  createOpportunity,
  getOpportunityById,
  deleteOpportunity,
} from "../controllers/opportunityController.js";

const router = Router();

/**
 * GET /api/opportunities/feed/:userId
 * Get personalized opportunities feed for a user
 */
router.get("/feed/:userId", getOpportunitiesFeed);

/**
 * GET /api/opportunities
 * Get all opportunities
 */
router.get("/", getAllOpportunities);

/**
 * POST /api/opportunities
 * Create a new opportunity
 */
router.post("/", createOpportunity);

/**
 * GET /api/opportunities/:id
 * Get a specific opportunity by ID
 */
router.get("/:id", getOpportunityById);

/**
 * DELETE /api/opportunities/:id
 * Delete an opportunity
 */
router.delete("/:id", deleteOpportunity);

export default router;
