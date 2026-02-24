"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rulesRelations = exports.audienceCheckersRelations = exports.campaignsRelations = exports.rules = exports.audienceCheckers = exports.campaigns = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
// Campaigns table
exports.campaigns = (0, mysql_core_1.mysqlTable)("campaigns", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 }).primaryKey(),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    campaignType: (0, mysql_core_1.varchar)("campaignType", { length: 50 }),
    jbpmId: (0, mysql_core_1.varchar)("jbpmId", { length: 255 }),
    activeFlag: (0, mysql_core_1.boolean)("activeFlag").default(true).notNull(),
    lockedFlag: (0, mysql_core_1.boolean)("lockedFlag").default(false).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Audience Checkers table
exports.audienceCheckers = (0, mysql_core_1.mysqlTable)("audience_checkers", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 }).primaryKey(),
    campaignId: (0, mysql_core_1.varchar)("campaignId", { length: 36 })
        .notNull()
        .references(() => exports.campaigns.id, { onDelete: "cascade" }),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    query: (0, mysql_core_1.text)("query"), // SQL query or condition
    rules: (0, mysql_core_1.text)("rules"), // JSON string of rules
    alignmentReport: (0, mysql_core_1.text)("alignmentReport"), // JSON string of alignment report
    status: (0, mysql_core_1.mysqlEnum)("status", ["pending", "active", "inactive", "completed"])
        .default("pending")
        .notNull(),
    alignmentStatus: (0, mysql_core_1.varchar)("alignmentStatus", { length: 50 }),
    lastChecked: (0, mysql_core_1.timestamp)("lastChecked"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Rules table
exports.rules = (0, mysql_core_1.mysqlTable)("rules", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 }).primaryKey(),
    checkerId: (0, mysql_core_1.varchar)("checkerId", { length: 36 })
        .notNull()
        .references(() => exports.audienceCheckers.id, { onDelete: "cascade" }),
    field: (0, mysql_core_1.varchar)("field", { length: 255 }).notNull(),
    operator: (0, mysql_core_1.varchar)("operator", { length: 50 }).notNull(),
    value: (0, mysql_core_1.text)("value"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Relations
exports.campaignsRelations = (0, drizzle_orm_1.relations)(exports.campaigns, ({ many }) => ({
    audienceCheckers: many(exports.audienceCheckers),
}));
exports.audienceCheckersRelations = (0, drizzle_orm_1.relations)(exports.audienceCheckers, ({ one, many }) => ({
    campaign: one(exports.campaigns, {
        fields: [exports.audienceCheckers.campaignId],
        references: [exports.campaigns.id],
    }),
    rulesList: many(exports.rules),
}));
exports.rulesRelations = (0, drizzle_orm_1.relations)(exports.rules, ({ one }) => ({
    audienceChecker: one(exports.audienceCheckers, {
        fields: [exports.rules.checkerId],
        references: [exports.audienceCheckers.id],
    }),
}));
//# sourceMappingURL=schema.js.map