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

// Seed data constants
const SEED_CAMPAIGNS = [
  {
    id: uuidv4(),
    name: "Play Journey Campaign",
    description: "Campaign for play journey audience",
    campaignType: "play",
    activeFlag: true,
    lockedFlag: false,
  },
  {
    id: uuidv4(),
    name: "Comeback Journey Campaign",
    description: "Campaign for comeback journey audience",
    campaignType: "comeback",
    activeFlag: true,
    lockedFlag: false,
  },
] as const;

async function clearDatabase(
  db: ReturnType<typeof getDatabase>,
): Promise<void> {
  logger.info("Clearing existing data...");
  await db.delete(rules);
  await db.delete(audienceCheckers);
  await db.delete(campaigns);
}

async function seedCampaigns(
  db: ReturnType<typeof getDatabase>,
): Promise<string[]> {
  const campaignIds = SEED_CAMPAIGNS.map((c) => c.id);

  await db.insert(campaigns).values(
    SEED_CAMPAIGNS.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      campaignType: c.campaignType,
      activeFlag: c.activeFlag,
      lockedFlag: c.lockedFlag,
    })),
  );

  logger.info("✅ Campaigns created", { count: campaignIds.length });
  return campaignIds;
}

async function seedCheckers(
  db: ReturnType<typeof getDatabase>,
  campaignId: string,
): Promise<string[]> {
  const checkerData = [
    { id: uuidv4(), name: "Mobile Users Checker" },
    { id: uuidv4(), name: "High Value Users Checker" },
  ];

  await db.insert(audienceCheckers).values(
    checkerData.map((c) => ({
      id: c.id,
      campaignId,
      name: c.name,
      rules: JSON.stringify([]),
      status: "active" as const,
      alignmentStatus: null,
      lastChecked: null,
    })),
  );

  logger.info("✅ Checkers created", { count: checkerData.length });
  return checkerData.map((c) => c.id);
}

async function seedRules(
  db: ReturnType<typeof getDatabase>,
  checkerId: string,
): Promise<void> {
  const ruleData = [
    { field: "device_type", operator: "equals", value: "mobile" },
    { field: "active_status", operator: "equals", value: "active" },
  ];

  await db.insert(rules).values(
    ruleData.map((r) => ({
      id: uuidv4(),
      checkerId,
      ...r,
    })),
  );

  logger.info("✅ Rules created", { count: ruleData.length });
}

async function seedDatabase(): Promise<void> {
  try {
    logger.info("Starting database seeding...");

    await initializeDatabase();
    const db = getDatabase();

    // Clear existing data for idempotent seeding
    await clearDatabase(db);

    // Seed in order: campaigns -> checkers -> rules
    const campaignIds = await seedCampaigns(db);
    const checkerIds = await seedCheckers(db, campaignIds[0]);
    await seedRules(db, checkerIds[0]);

    logger.info("🎉 Database seeded successfully");
  } catch (error) {
    logger.error("❌ Error seeding database", error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

seedDatabase();
