"use strict";
/**
 * Database seed script using Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const uuid_1 = require("uuid");
const db_1 = require("../src/db");
const helpers_1 = require("../src/utils/helpers");
const types_1 = require("../src/types");
async function seedDatabase() {
    try {
        helpers_1.logger.info("Starting database seeding...");
        await (0, db_1.initializeDatabase)();
        const db = (0, db_1.getDatabase)();
        // Create sample campaigns
        const campaign1Id = (0, uuid_1.v4)();
        const campaign2Id = (0, uuid_1.v4)();
        await db.insert(db_1.campaigns).values({
            id: campaign1Id,
            name: "Play Journey Campaign",
            description: "Campaign for play journey audience",
            campaignType: "play",
            activeFlag: true,
            lockedFlag: false,
        });
        await db.insert(db_1.campaigns).values({
            id: campaign2Id,
            name: "Comeback Journey Campaign",
            description: "Campaign for comeback journey audience",
            campaignType: "comeback",
            activeFlag: true,
            lockedFlag: false,
        });
        helpers_1.logger.info("✅ Campaigns created", { campaign1Id, campaign2Id });
        // Create sample checkers for campaign 1
        const checker1Id = (0, uuid_1.v4)();
        const checker2Id = (0, uuid_1.v4)();
        await db.insert(db_1.audienceCheckers).values({
            id: checker1Id,
            campaignId: campaign1Id,
            name: "Mobile Users Checker",
            rules: JSON.stringify([]),
            status: types_1.CheckerStatus.ACTIVE,
            alignmentStatus: null,
            lastChecked: null,
        });
        await db.insert(db_1.audienceCheckers).values({
            id: checker2Id,
            campaignId: campaign1Id,
            name: "High Value Users Checker",
            rules: JSON.stringify([]),
            status: types_1.CheckerStatus.ACTIVE,
            alignmentStatus: null,
            lastChecked: null,
        });
        helpers_1.logger.info("✅ Checkers created", { checker1Id, checker2Id });
        // Create sample rules for checker 1
        await db.insert(db_1.rules).values({
            id: (0, uuid_1.v4)(),
            checkerId: checker1Id,
            field: "device_type",
            operator: "equals",
            value: "mobile",
        });
        await db.insert(db_1.rules).values({
            id: (0, uuid_1.v4)(),
            checkerId: checker1Id,
            field: "active_status",
            operator: "equals",
            value: "active",
        });
        helpers_1.logger.info("✅ Rules created");
        helpers_1.logger.info("🎉 Database seeded successfully");
    }
    catch (error) {
        helpers_1.logger.error("❌ Error seeding database", error);
        process.exit(1);
    }
    finally {
        await (0, db_1.closeDatabase)();
    }
}
seedDatabase();
//# sourceMappingURL=seed.js.map