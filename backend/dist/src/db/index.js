"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
const mysql2_1 = require("drizzle-orm/mysql2");
const promise_1 = __importDefault(require("mysql2/promise"));
const schema = __importStar(require("./schema"));
const helpers_1 = require("../utils/helpers");
let pool = null;
let db = null;
function getDbConfig() {
    return {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "3306", 10),
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "audience_checker",
    };
}
async function initializeDatabase() {
    if (db) {
        return db;
    }
    const config = getDbConfig();
    helpers_1.logger.info(`Connecting to MySQL database: ${config.database}`);
    // First, ensure the database exists
    const tempConnection = await promise_1.default.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
    });
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
    await tempConnection.end();
    // Create the connection pool
    pool = promise_1.default.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
    // Initialize Drizzle with the pool
    db = (0, mysql2_1.drizzle)(pool, { schema, mode: "default" });
    // Create tables if they don't exist (using raw SQL for initial setup)
    await createTables(pool);
    helpers_1.logger.info("Database initialized successfully with Drizzle ORM");
    return db;
}
async function createTables(pool) {
    const connection = await pool.getConnection();
    try {
        // Create campaigns table
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        campaignType VARCHAR(50),
        jbpmId VARCHAR(255),
        activeFlag BOOLEAN DEFAULT TRUE,
        lockedFlag BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        // Create audience_checkers table
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS audience_checkers (
        id VARCHAR(36) PRIMARY KEY,
        campaignId VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        rules TEXT,
        status ENUM('pending', 'active', 'inactive', 'completed') DEFAULT 'pending',
        alignmentStatus VARCHAR(50),
        lastChecked TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE CASCADE
      )
    `);
        // Create rules table
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS rules (
        id VARCHAR(36) PRIMARY KEY,
        checkerId VARCHAR(36) NOT NULL,
        field VARCHAR(255) NOT NULL,
        operator VARCHAR(50) NOT NULL,
        value TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (checkerId) REFERENCES audience_checkers(id) ON DELETE CASCADE
      )
    `);
        helpers_1.logger.info("Database tables created/verified");
    }
    finally {
        connection.release();
    }
}
function getDatabase() {
    if (!db) {
        throw new Error("Database not initialized. Call initializeDatabase() first.");
    }
    return db;
}
async function closeDatabase() {
    if (pool) {
        await pool.end();
        pool = null;
        db = null;
        helpers_1.logger.info("Database connection closed");
    }
}
// Re-export schema for convenience
__exportStar(require("./schema"), exports);
//# sourceMappingURL=index.js.map