import express, { Express, Request, Response } from "express";
import cors from "cors";
import "dotenv/config";

import opportunityRoutes from "./routes/opportunityRoutes.js";
import userRoutes from "./routes/userRoutes.js";

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
app.use(`${apiPrefix}/users`, userRoutes);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to OpTrack AI API",
    version: "1.0.0",
    endpoints: {
      users: `${apiPrefix}/users`,
      opportunities: `${apiPrefix}/opportunities`,
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
