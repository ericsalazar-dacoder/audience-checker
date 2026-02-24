import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { logger } from "../utils/helpers";

let pool: mysql.Pool | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function getDbConfig(): DbConfig {
  return {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "audience_checker",
  };
}

export async function initializeDatabase(): Promise<
  ReturnType<typeof drizzle<typeof schema>>
> {
  if (db) {
    return db;
  }

  const config = getDbConfig();
  logger.info(`Connecting to MySQL database: ${config.database}`);

  // First, ensure the database exists
  const tempConnection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  });

  await tempConnection.execute(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\``
  );
  await tempConnection.end();

  // Create the connection pool
  pool = mysql.createPool({
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
  db = drizzle(pool, { schema, mode: "default" });

  // Create tables if they don't exist (using raw SQL for initial setup)
  await createTables(pool);

  logger.info("Database initialized successfully with Drizzle ORM");

  return db;
}

async function createTables(pool: mysql.Pool): Promise<void> {
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

    logger.info("Database tables created/verified");
  } finally {
    connection.release();
  }
}

export function getDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    logger.info("Database connection closed");
  }
}

// Re-export schema for convenience
export * from "./schema";
