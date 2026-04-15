import express, { Express, Request, Response } from "express";
import cors from "cors";
import "dotenv/config";

import opportunityRoutes from "./routes/opportunityRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dataRoutes from "./routes/dataRoutes.js";
import scraperRoutes from "./routes/scraperRoutes.js";
import preferenceRoutes from "./routes/preferenceRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Prefix
const apiPrefix = process.env.API_PREFIX || "/api";

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use(`${apiPrefix}/opportunities`, opportunityRoutes);
app.use(`${apiPrefix}/recommendations`, recommendationRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/preferences`, preferenceRoutes);
app.use(`${apiPrefix}/data`, dataRoutes);
app.use(`${apiPrefix}/scraper`, scraperRoutes);
app.use(`${apiPrefix}/chat`, chatRoutes);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to OpTrack AI API",
    version: "1.0.0",
    endpoints: {
      users: `${apiPrefix}/users`,
      opportunities: `${apiPrefix}/opportunities`,
      recommendations: `${apiPrefix}/recommendations/:userId`,
      data: `${apiPrefix}/data`,
      scraper: `${apiPrefix}/scraper/run-all`,
      preferences: `${apiPrefix}/preferences`,
      health: "/health",
    },
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

export default app;
