"use strict";
/**
 * Campaign Service - Business logic layer using Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignService = exports.CampaignService = void 0;
const uuid_1 = require("uuid");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const errors_1 = require("../utils/errors");
const helpers_1 = require("../utils/helpers");
class CampaignService {
    async getAllCampaigns() {
        try {
            const db = (0, db_1.getDatabase)();
            // Get all campaigns with checker count
            const result = await db
                .select({
                id: db_1.campaigns.id,
                name: db_1.campaigns.name,
                description: db_1.campaigns.description,
                campaignType: db_1.campaigns.campaignType,
                jbpmId: db_1.campaigns.jbpmId,
                activeFlag: db_1.campaigns.activeFlag,
                lockedFlag: db_1.campaigns.lockedFlag,
                createdAt: db_1.campaigns.createdAt,
                updatedAt: db_1.campaigns.updatedAt,
                checkerCount: (0, drizzle_orm_1.sql) `COUNT(${db_1.audienceCheckers.id})`.as("checkerCount"),
            })
                .from(db_1.campaigns)
                .leftJoin(db_1.audienceCheckers, (0, drizzle_orm_1.eq)(db_1.campaigns.id, db_1.audienceCheckers.campaignId))
                .groupBy(db_1.campaigns.id)
                .orderBy((0, drizzle_orm_1.desc)(db_1.campaigns.createdAt));
            const mappedCampaigns = result.map((row) => ({
                id: row.id,
                name: row.name,
                description: row.description ?? undefined,
                campaignType: row.campaignType ?? undefined,
                jbpmId: row.jbpmId ?? undefined,
                activeFlag: row.activeFlag,
                lockedFlag: row.lockedFlag,
                createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
                updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
                checkerCount: Number(row.checkerCount) || 0,
            }));
            helpers_1.logger.debug("Retrieved all campaigns", {
                count: mappedCampaigns.length,
            });
            return mappedCampaigns;
        }
        catch (error) {
            helpers_1.logger.error("Error fetching campaigns", error);
            throw error;
        }
    }
    async getCampaignById(id) {
        if (!id) {
            throw new errors_1.ValidationError("Campaign ID is required");
        }
        try {
            const db = (0, db_1.getDatabase)();
            const result = await db
                .select()
                .from(db_1.campaigns)
                .where((0, drizzle_orm_1.eq)(db_1.campaigns.id, id))
                .limit(1);
            if (result.length === 0) {
                throw new errors_1.NotFoundError(`Campaign with ID ${id} not found`);
            }
            const row = result[0];
            const campaign = {
                id: row.id,
                name: row.name,
                description: row.description ?? undefined,
                campaignType: row.campaignType ?? undefined,
                jbpmId: row.jbpmId ?? undefined,
                activeFlag: row.activeFlag,
                lockedFlag: row.lockedFlag,
                createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
                updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
            };
            helpers_1.logger.debug("Retrieved campaign", { id });
            return campaign;
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError)
                throw error;
            helpers_1.logger.error("Error fetching campaign", { id, error });
            throw error;
        }
    }
    async createCampaign(data) {
        if (!data.name?.trim()) {
            throw new errors_1.ValidationError("Campaign name is required");
        }
        const id = (0, uuid_1.v4)();
        try {
            const db = (0, db_1.getDatabase)();
            await db.insert(db_1.campaigns).values({
                id,
                name: data.name,
                description: data.description ?? null,
                campaignType: data.campaignType ?? null,
                jbpmId: data.jbpmId ?? null,
                activeFlag: true,
                lockedFlag: false,
            });
            const campaign = await this.getCampaignById(id);
            helpers_1.logger.info("Campaign created", { id, name: data.name });
            return campaign;
        }
        catch (error) {
            helpers_1.logger.error("Error creating campaign", { data, error });
            throw error;
        }
    }
    async updateCampaign(id, data) {
        if (!id) {
            throw new errors_1.ValidationError("Campaign ID is required");
        }
        const campaign = await this.getCampaignById(id);
        try {
            const db = (0, db_1.getDatabase)();
            await db
                .update(db_1.campaigns)
                .set({
                name: data.name ?? campaign.name,
                description: data.description ?? campaign.description ?? null,
                campaignType: data.campaignType ?? campaign.campaignType ?? null,
                jbpmId: data.jbpmId ?? campaign.jbpmId ?? null,
                activeFlag: data.activeFlag ?? campaign.activeFlag,
                lockedFlag: data.lockedFlag ?? campaign.lockedFlag,
            })
                .where((0, drizzle_orm_1.eq)(db_1.campaigns.id, id));
            const updated = await this.getCampaignById(id);
            helpers_1.logger.info("Campaign updated", { id });
            return updated;
        }
        catch (error) {
            helpers_1.logger.error("Error updating campaign", { id, error });
            throw error;
        }
    }
    async deleteCampaign(id) {
        if (!id) {
            throw new errors_1.ValidationError("Campaign ID is required");
        }
        await this.getCampaignById(id);
        try {
            const db = (0, db_1.getDatabase)();
            await db.delete(db_1.campaigns).where((0, drizzle_orm_1.eq)(db_1.campaigns.id, id));
            helpers_1.logger.info("Campaign deleted", { id });
        }
        catch (error) {
            helpers_1.logger.error("Error deleting campaign", { id, error });
            throw error;
        }
    }
}
exports.CampaignService = CampaignService;
exports.campaignService = new CampaignService();
//# sourceMappingURL=campaignService.js.map