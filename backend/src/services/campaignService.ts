/**
 * Campaign Service - Business logic layer using Drizzle ORM
 */

import { v4 as uuidv4 } from "uuid";
import { eq, sql, desc } from "drizzle-orm";
import { getDatabase, campaigns, audienceCheckers } from "../db";
import { Campaign, CreateCampaignDto, UpdateCampaignDto } from "../types";
import { NotFoundError, ValidationError } from "../utils/errors";
import { logger } from "../utils/helpers";

export class CampaignService {
  async getAllCampaigns(): Promise<Campaign[]> {
    try {
      const db = getDatabase();

      // Get all campaigns with checker count
      const result = await db
        .select({
          id: campaigns.id,
          name: campaigns.name,
          description: campaigns.description,
          campaignType: campaigns.campaignType,
          jbpmId: campaigns.jbpmId,
          activeFlag: campaigns.activeFlag,
          lockedFlag: campaigns.lockedFlag,
          createdAt: campaigns.createdAt,
          updatedAt: campaigns.updatedAt,
          checkerCount: sql<number>`COUNT(${audienceCheckers.id})`.as(
            "checkerCount"
          ),
        })
        .from(campaigns)
        .leftJoin(
          audienceCheckers,
          eq(campaigns.id, audienceCheckers.campaignId)
        )
        .groupBy(campaigns.id)
        .orderBy(desc(campaigns.createdAt));

      const mappedCampaigns: Campaign[] = result.map((row) => ({
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

      logger.debug("Retrieved all campaigns", {
        count: mappedCampaigns.length,
      });
      return mappedCampaigns;
    } catch (error) {
      logger.error("Error fetching campaigns", error);
      throw error;
    }
  }

  async getCampaignById(id: string): Promise<Campaign> {
    if (!id) {
      throw new ValidationError("Campaign ID is required");
    }

    try {
      const db = getDatabase();

      const result = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, id))
        .limit(1);

      if (result.length === 0) {
        throw new NotFoundError(`Campaign with ID ${id} not found`);
      }

      const row = result[0];
      const campaign: Campaign = {
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

      logger.debug("Retrieved campaign", { id });
      return campaign;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error("Error fetching campaign", { id, error });
      throw error;
    }
  }

  async createCampaign(data: CreateCampaignDto): Promise<Campaign> {
    if (!data.name?.trim()) {
      throw new ValidationError("Campaign name is required");
    }

    const id = uuidv4();

    try {
      const db = getDatabase();

      await db.insert(campaigns).values({
        id,
        name: data.name,
        description: data.description ?? null,
        campaignType: data.campaignType ?? null,
        jbpmId: data.jbpmId ?? null,
        activeFlag: true,
        lockedFlag: false,
      });

      const campaign = await this.getCampaignById(id);
      logger.info("Campaign created", { id, name: data.name });
      return campaign;
    } catch (error) {
      logger.error("Error creating campaign", { data, error });
      throw error;
    }
  }

  async updateCampaign(id: string, data: UpdateCampaignDto): Promise<Campaign> {
    if (!id) {
      throw new ValidationError("Campaign ID is required");
    }

    const campaign = await this.getCampaignById(id);

    try {
      const db = getDatabase();

      await db
        .update(campaigns)
        .set({
          name: data.name ?? campaign.name,
          description: data.description ?? campaign.description ?? null,
          campaignType: data.campaignType ?? campaign.campaignType ?? null,
          jbpmId: data.jbpmId ?? campaign.jbpmId ?? null,
          activeFlag: data.activeFlag ?? campaign.activeFlag,
          lockedFlag: data.lockedFlag ?? campaign.lockedFlag,
        })
        .where(eq(campaigns.id, id));

      const updated = await this.getCampaignById(id);
      logger.info("Campaign updated", { id });
      return updated;
    } catch (error) {
      logger.error("Error updating campaign", { id, error });
      throw error;
    }
  }

  async deleteCampaign(id: string): Promise<void> {
    if (!id) {
      throw new ValidationError("Campaign ID is required");
    }

    await this.getCampaignById(id);

    try {
      const db = getDatabase();
      await db.delete(campaigns).where(eq(campaigns.id, id));
      logger.info("Campaign deleted", { id });
    } catch (error) {
      logger.error("Error deleting campaign", { id, error });
      throw error;
    }
  }
}

export const campaignService = new CampaignService();
