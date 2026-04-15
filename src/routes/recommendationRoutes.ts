import { Router } from "express";
import { getRecommendations } from "../controllers/recommendationController.js";

const router = Router();

/**
 * GET /api/recommendations/:userId
 * Get ranked recommendations for a user.
 */
router.get("/:userId", getRecommendations);

export default router;
