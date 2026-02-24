"use strict";
/**
 * TypeScript-based database module with proper typing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
const helpers_1 = require("../utils/helpers");
let db = null;
async function initializeDatabase() {
    const dbPath = process.env.DATABASE_PATH ||
        path_1.default.join(__dirname, "../data/audience-checker.db");
    db = await (0, sqlite_1.open)({
        filename: dbPath,
        driver: sqlite3_1.default.Database,
    });
    helpers_1.logger.info("Connected to SQLite database", { path: dbPath });
    // Enable foreign keys
    await db.exec("PRAGMA foreign_keys = ON");
    await createSchema();
    return db;
}
function getDatabase() {
    if (!db) {
        throw new Error("Database not initialized. Call initializeDatabase first.");
    }
    return db;
}
async function createSchema() {
    if (!db)
        return;
    try {
        // Campaigns table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        campaignType TEXT,
        jbpmId TEXT,
        activeFlag INTEGER DEFAULT 1,
        lockedFlag INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Audience Checkers table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS audience_checkers (
        id TEXT PRIMARY KEY,
        campaignId TEXT NOT NULL,
        name TEXT NOT NULL,
        rules TEXT,
        status TEXT DEFAULT 'pending',
        alignmentStatus TEXT,
        lastChecked TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(campaignId) REFERENCES campaigns(id) ON DELETE CASCADE
      )
    `);
        // Rules table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS rules (
        id TEXT PRIMARY KEY,
        checkerId TEXT NOT NULL,
        field TEXT NOT NULL,
        operator TEXT NOT NULL,
        value TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(checkerId) REFERENCES audience_checkers(id) ON DELETE CASCADE
      )
    `);
        helpers_1.logger.info("Database schema initialized successfully");
    }
    catch (error) {
        helpers_1.logger.error("Error creating database schema", error);
        throw error;
    }
}
async function closeDatabase() {
    if (db) {
        await db.close();
        helpers_1.logger.info("Database connection closed");
    }
}
//# sourceMappingURL=database.js.map