import { Router } from "express";
import {
  getPreference,
  upsertPreference,
  getPreferenceByToken,
} from "../controllers/preferenceController.js";

const router = Router();

/**
 * GET /api/preferences
 * Get current user preferences by token
 */
router.get("/", getPreferenceByToken);

/**
 * POST /api/preferences
 * Create or update preferences
 */
router.post("/", upsertPreference);

/**
 * GET /api/preferences/user/:id
 * Get preferences by user ID
 */
router.get("/user/:id", getPreference);

export default router;
