/**
 * Database seed script using Drizzle ORM
 */

import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import {
  initializeDatabase,
  closeDatabase,
  getDatabase,
  campaigns,
  audienceCheckers,
  rules,
} from "../src/db";
import { logger } from "../src/utils/helpers";
import { CheckerStatus } from "../src/types";

async function seedDatabase(): Promise<void> {
  try {
    logger.info("Starting database seeding...");

    await initializeDatabase();
    const db = getDatabase();

    // Create sample campaigns
    const campaign1Id = uuidv4();
    const campaign2Id = uuidv4();

    await db.insert(campaigns).values({
      id: campaign1Id,
      name: "Play Journey Campaign",
      description: "Campaign for play journey audience",
      campaignType: "play",
      activeFlag: true,
      lockedFlag: false,
    });

    await db.insert(campaigns).values({
      id: campaign2Id,
      name: "Comeback Journey Campaign",
      description: "Campaign for comeback journey audience",
      campaignType: "comeback",
      activeFlag: true,
      lockedFlag: false,
    });

    logger.info("✅ Campaigns created", { campaign1Id, campaign2Id });

    // Create sample checkers for campaign 1
    const checker1Id = uuidv4();
    const checker2Id = uuidv4();

    await db.insert(audienceCheckers).values({
      id: checker1Id,
      campaignId: campaign1Id,
      name: "Mobile Users Checker",
      rules: JSON.stringify([]),
      status: CheckerStatus.ACTIVE as
        | "pending"
        | "active"
        | "inactive"
        | "completed",
      alignmentStatus: null,
      lastChecked: null,
    });

    await db.insert(audienceCheckers).values({
      id: checker2Id,
      campaignId: campaign1Id,
      name: "High Value Users Checker",
      rules: JSON.stringify([]),
      status: CheckerStatus.ACTIVE as
        | "pending"
        | "active"
        | "inactive"
        | "completed",
      alignmentStatus: null,
      lastChecked: null,
    });

    logger.info("✅ Checkers created", { checker1Id, checker2Id });

    // Create sample rules for checker 1
    await db.insert(rules).values({
      id: uuidv4(),
      checkerId: checker1Id,
      field: "device_type",
      operator: "equals",
      value: "mobile",
    });

    await db.insert(rules).values({
      id: uuidv4(),
      checkerId: checker1Id,
      field: "active_status",
      operator: "equals",
      value: "active",
    });

    logger.info("✅ Rules created");
    logger.info("🎉 Database seeded successfully");
  } catch (error) {
    logger.error("❌ Error seeding database", error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

seedDatabase();
