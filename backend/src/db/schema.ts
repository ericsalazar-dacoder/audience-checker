import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// Campaigns table
export const campaigns = mysqlTable("campaigns", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  campaignType: varchar("campaignType", { length: 50 }),
  jbpmId: varchar("jbpmId", { length: 255 }),
  activeFlag: boolean("activeFlag").default(true).notNull(),
  lockedFlag: boolean("lockedFlag").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Audience Checkers table
export const audienceCheckers = mysqlTable("audience_checkers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  campaignId: varchar("campaignId", { length: 36 })
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  query: text("query"), // SQL query or condition
  rules: text("rules"), // JSON string of rules
  alignmentReport: text("alignmentReport"), // JSON string of alignment report
  status: mysqlEnum("status", ["pending", "active", "inactive", "completed"])
    .default("pending")
    .notNull(),
  alignmentStatus: varchar("alignmentStatus", { length: 50 }),
  lastChecked: timestamp("lastChecked"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Rules table
export const rules = mysqlTable("rules", {
  id: varchar("id", { length: 36 }).primaryKey(),
  checkerId: varchar("checkerId", { length: 36 })
    .notNull()
    .references(() => audienceCheckers.id, { onDelete: "cascade" }),
  field: varchar("field", { length: 255 }).notNull(),
  operator: varchar("operator", { length: 50 }).notNull(),
  value: text("value"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Relations
export const campaignsRelations = relations(campaigns, ({ many }) => ({
  audienceCheckers: many(audienceCheckers),
}));

export const audienceCheckersRelations = relations(
  audienceCheckers,
  ({ one, many }) => ({
    campaign: one(campaigns, {
      fields: [audienceCheckers.campaignId],
      references: [campaigns.id],
    }),
    rulesList: many(rules),
  })
);

export const rulesRelations = relations(rules, ({ one }) => ({
  audienceChecker: one(audienceCheckers, {
    fields: [rules.checkerId],
    references: [audienceCheckers.id],
  }),
}));

// Type exports for use in services
export type CampaignSelect = typeof campaigns.$inferSelect;
export type CampaignInsert = typeof campaigns.$inferInsert;

export type AudienceCheckerSelect = typeof audienceCheckers.$inferSelect;
export type AudienceCheckerInsert = typeof audienceCheckers.$inferInsert;

export type RuleSelect = typeof rules.$inferSelect;
export type RuleInsert = typeof rules.$inferInsert;
