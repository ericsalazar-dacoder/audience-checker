"use strict";
/**
 * Audience Checker Service - Business logic layer using Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkerService = exports.CheckerService = void 0;
const uuid_1 = require("uuid");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const helpers_1 = require("../utils/helpers");
const campaignService_1 = require("./campaignService");
class CheckerService {
    async getCheckersByCampaign(campaignId) {
        if (!campaignId) {
            throw new errors_1.ValidationError("Campaign ID is required");
        }
        // Verify campaign exists
        await campaignService_1.campaignService.getCampaignById(campaignId);
        try {
            const db = (0, db_1.getDatabase)();
            const result = await db
                .select()
                .from(db_1.audienceCheckers)
                .where((0, drizzle_orm_1.eq)(db_1.audienceCheckers.campaignId, campaignId))
                .orderBy((0, drizzle_orm_1.desc)(db_1.audienceCheckers.createdAt));
            const checkers = result.map((row) => ({
                id: row.id,
                campaignId: row.campaignId,
                name: row.name,
                query: row.query ?? undefined,
                rules: row.rules
                    ? typeof row.rules === "string"
                        ? JSON.parse(row.rules)
                        : row.rules
                    : undefined,
                alignmentReport: row.alignmentReport
                    ? typeof row.alignmentReport === "string"
                        ? JSON.parse(row.alignmentReport)
                        : row.alignmentReport
                    : undefined,
                status: row.status,
                alignmentStatus: row.alignmentStatus ?? undefined,
                lastChecked: row.lastChecked?.toISOString() ?? undefined,
                createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
                updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
            }));
            helpers_1.logger.debug("Retrieved checkers for campaign", {
                campaignId,
                count: checkers.length,
            });
            return checkers;
        }
        catch (error) {
            helpers_1.logger.error("Error fetching checkers", { campaignId, error });
            throw error;
        }
    }
    async getCheckerById(id) {
        if (!id) {
            throw new errors_1.ValidationError("Checker ID is required");
        }
        try {
            const db = (0, db_1.getDatabase)();
            const checkerResult = await db
                .select()
                .from(db_1.audienceCheckers)
                .where((0, drizzle_orm_1.eq)(db_1.audienceCheckers.id, id))
                .limit(1);
            if (checkerResult.length === 0) {
                throw new errors_1.NotFoundError(`Checker with ID ${id} not found`);
            }
            const rulesResult = await db
                .select()
                .from(db_1.rules)
                .where((0, drizzle_orm_1.eq)(db_1.rules.checkerId, id))
                .orderBy(db_1.rules.createdAt);
            const row = checkerResult[0];
            const checkerRules = rulesResult.map((r) => ({
                id: r.id,
                checkerId: r.checkerId,
                field: r.field,
                operator: r.operator,
                value: r.value ?? undefined,
                createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
                updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
            }));
            const checker = {
                id: row.id,
                campaignId: row.campaignId,
                name: row.name,
                rules: checkerRules,
                status: row.status,
                alignmentStatus: row.alignmentStatus ?? undefined,
                lastChecked: row.lastChecked?.toISOString() ?? undefined,
                createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
                updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
            };
            helpers_1.logger.debug("Retrieved checker with rules", {
                id,
                rulesCount: checkerRules.length,
            });
            return checker;
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError)
                throw error;
            helpers_1.logger.error("Error fetching checker", { id, error });
            throw error;
        }
    }
    async createChecker(data) {
        if (!data.campaignId?.trim()) {
            throw new errors_1.ValidationError("Campaign ID is required");
        }
        if (!data.name?.trim()) {
            throw new errors_1.ValidationError("Checker name is required");
        }
        // Verify campaign exists
        await campaignService_1.campaignService.getCampaignById(data.campaignId);
        const id = (0, uuid_1.v4)();
        try {
            const db = (0, db_1.getDatabase)();
            await db.insert(db_1.audienceCheckers).values({
                id,
                campaignId: data.campaignId,
                name: data.name,
                query: data.query || null,
                rules: data.rules ? JSON.stringify(data.rules) : null,
                alignmentReport: data.alignmentReport
                    ? JSON.stringify(data.alignmentReport)
                    : null,
                status: types_1.CheckerStatus.PENDING,
                alignmentStatus: data.alignmentReport
                    ? `${data.alignmentReport.alignmentPercentage}%`
                    : null,
                lastChecked: data.alignmentReport ? new Date() : null,
            });
            const checker = await this.getCheckerById(id);
            helpers_1.logger.info("Checker created", { id, name: data.name });
            return checker;
        }
        catch (error) {
            helpers_1.logger.error("Error creating checker", { data, error });
            throw error;
        }
    }
    async updateChecker(id, data) {
        if (!id) {
            throw new errors_1.ValidationError("Checker ID is required");
        }
        const checker = await this.getCheckerById(id);
        try {
            const db = (0, db_1.getDatabase)();
            await db
                .update(db_1.audienceCheckers)
                .set({
                name: data.name ?? checker.name,
                query: data.query !== undefined ? data.query : checker.query ?? null,
                rules: data.rules ? JSON.stringify(data.rules) : undefined,
                alignmentReport: data.alignmentReport
                    ? JSON.stringify(data.alignmentReport)
                    : undefined,
                status: (data.status ?? checker.status),
                alignmentStatus: data.alignmentReport
                    ? `${data.alignmentReport.alignmentPercentage}%`
                    : data.alignmentStatus ?? checker.alignmentStatus ?? null,
                lastChecked: data.alignmentReport ? new Date() : undefined,
            })
                .where((0, drizzle_orm_1.eq)(db_1.audienceCheckers.id, id));
            const updated = await this.getCheckerById(id);
            helpers_1.logger.info("Checker updated", { id });
            return updated;
        }
        catch (error) {
            helpers_1.logger.error("Error updating checker", { id, error });
            throw error;
        }
    }
    async deleteChecker(id) {
        if (!id) {
            throw new errors_1.ValidationError("Checker ID is required");
        }
        await this.getCheckerById(id);
        try {
            const db = (0, db_1.getDatabase)();
            await db.delete(db_1.audienceCheckers).where((0, drizzle_orm_1.eq)(db_1.audienceCheckers.id, id));
            helpers_1.logger.info("Checker deleted", { id });
        }
        catch (error) {
            helpers_1.logger.error("Error deleting checker", { id, error });
            throw error;
        }
    }
    async addRule(checkerId, data) {
        if (!checkerId?.trim()) {
            throw new errors_1.ValidationError("Checker ID is required");
        }
        if (!data.field?.trim()) {
            throw new errors_1.ValidationError("Field is required");
        }
        if (!data.operator?.trim()) {
            throw new errors_1.ValidationError("Operator is required");
        }
        await this.getCheckerById(checkerId);
        const ruleId = (0, uuid_1.v4)();
        try {
            const db = (0, db_1.getDatabase)();
            await db.insert(db_1.rules).values({
                id: ruleId,
                checkerId,
                field: data.field,
                operator: data.operator,
                value: data.value ?? null,
            });
            const result = await db
                .select()
                .from(db_1.rules)
                .where((0, drizzle_orm_1.eq)(db_1.rules.id, ruleId))
                .limit(1);
            const row = result[0];
            const rule = {
                id: row.id,
                checkerId: row.checkerId,
                field: row.field,
                operator: row.operator,
                value: row.value ?? undefined,
                createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
                updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
            };
            helpers_1.logger.info("Rule added", { ruleId, checkerId });
            return rule;
        }
        catch (error) {
            helpers_1.logger.error("Error adding rule", { checkerId, data, error });
            throw error;
        }
    }
    async deleteRule(ruleId) {
        if (!ruleId) {
            throw new errors_1.ValidationError("Rule ID is required");
        }
        const db = (0, db_1.getDatabase)();
        const ruleResult = await db
            .select()
            .from(db_1.rules)
            .where((0, drizzle_orm_1.eq)(db_1.rules.id, ruleId))
            .limit(1);
        if (ruleResult.length === 0) {
            throw new errors_1.NotFoundError(`Rule with ID ${ruleId} not found`);
        }
        try {
            await db.delete(db_1.rules).where((0, drizzle_orm_1.eq)(db_1.rules.id, ruleId));
            helpers_1.logger.info("Rule deleted", { ruleId });
        }
        catch (error) {
            helpers_1.logger.error("Error deleting rule", { ruleId, error });
            throw error;
        }
    }
}
exports.CheckerService = CheckerService;
exports.checkerService = new CheckerService();
//# sourceMappingURL=checkerService.js.map