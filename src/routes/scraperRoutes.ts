import { Router } from "express";

import { runAllScrapersHandler } from "../controllers/scraperController.js";

const router = Router();

/**
 * POST /api/scraper/run-all
 * Trigger all scrapers manually
 */
router.post("/run-all", runAllScrapersHandler);

export default router;
