"use strict";
/**
 * Application Server
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const db_1 = require("./db");
const helpers_1 = require("./utils/helpers");
const errorHandler_1 = require("./middleware/errorHandler");
const campaigns_1 = __importDefault(require("./routes/campaigns"));
const checkers_1 = __importDefault(require("./routes/checkers"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
// Health check route
app.get("/api/health", (_req, res) => {
    const response = {
        success: true,
        data: {
            status: "Server is running",
            timestamp: new Date().toISOString(),
        },
    };
    res.json(response);
});
// API Routes
app.use("/api/campaigns", campaigns_1.default);
app.use("/api/checkers", checkers_1.default);
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
// Initialize and start server
async function startServer() {
    try {
        await (0, db_1.initializeDatabase)();
        app.listen(PORT, () => {
            helpers_1.logger.info(`🚀 Server running successfully`, {
                port: PORT,
                environment: process.env.NODE_ENV || "development",
                apiUrl: `http://localhost:${PORT}`,
                healthCheck: `http://localhost:${PORT}/api/health`,
            });
        });
    }
    catch (error) {
        helpers_1.logger.error("Failed to start server", error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on("SIGINT", async () => {
    helpers_1.logger.info("Shutting down gracefully...");
    await (0, db_1.closeDatabase)();
    process.exit(0);
});
process.on("SIGTERM", async () => {
    helpers_1.logger.info("Termination signal received");
    await (0, db_1.closeDatabase)();
    process.exit(0);
});
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map