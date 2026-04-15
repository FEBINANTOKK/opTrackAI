import { Router } from "express";
import { getAllData } from "../controllers/dataController.js";

const router = Router();

/**
 * GET /api/data
 * Fetch all users and opportunities from DB
 */
router.get("/", getAllData);

export default router;
