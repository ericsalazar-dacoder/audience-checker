/**
 * Application Server
 */

import express from "express";
import cors from "cors";
import "dotenv/config";

import { initializeDatabase, closeDatabase } from "./db";
import { logger } from "./utils/helpers";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import campaignRoutes from "./routes/campaigns";
import checkerRoutes from "./routes/checkers";
import { ApiResponse } from "./types";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Health check route
app.get("/api/health", (_req, res) => {
  const response: ApiResponse<{ status: string; timestamp: string }> = {
    success: true,
    data: {
      status: "Server is running",
      timestamp: new Date().toISOString(),
    },
  };
  res.json(response);
});

// API Routes
app.use("/api/campaigns", campaignRoutes);
app.use("/api/checkers", checkerRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize and start server
async function startServer(): Promise<void> {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running successfully`, {
        port: PORT,
        environment: process.env.NODE_ENV || "development",
        apiUrl: `http://localhost:${PORT}`,
        healthCheck: `http://localhost:${PORT}/api/health`,
      });
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down gracefully...");
  await closeDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Termination signal received");
  await closeDatabase();
  process.exit(0);
});

startServer();

export default app;
