/**
 * Audience Checker Service - Business logic layer using Drizzle ORM
 */

import { v4 as uuidv4 } from "uuid";
import { eq, desc } from "drizzle-orm";
import { getDatabase, audienceCheckers, rules } from "../db";
import {
  AudienceChecker,
  CreateCheckerDto,
  UpdateCheckerDto,
  CreateRuleDto,
  Rule,
  CheckerStatus,
} from "../types";
import { NotFoundError, ValidationError } from "../utils/errors";
import { logger } from "../utils/helpers";
import { campaignService } from "./campaignService";

export class CheckerService {
  async getCheckersByCampaign(campaignId: string): Promise<AudienceChecker[]> {
    if (!campaignId) {
      throw new ValidationError("Campaign ID is required");
    }

    // Verify campaign exists
    await campaignService.getCampaignById(campaignId);

    try {
      const db = getDatabase();

      const result = await db
        .select()
        .from(audienceCheckers)
        .where(eq(audienceCheckers.campaignId, campaignId))
        .orderBy(desc(audienceCheckers.createdAt));

      const checkers: AudienceChecker[] = result.map((row) => ({
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
        status: row.status as CheckerStatus,
        alignmentStatus: row.alignmentStatus ?? undefined,
        lastChecked: row.lastChecked?.toISOString() ?? undefined,
        createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
      }));

      logger.debug("Retrieved checkers for campaign", {
        campaignId,
        count: checkers.length,
      });
      return checkers;
    } catch (error) {
      logger.error("Error fetching checkers", { campaignId, error });
      throw error;
    }
  }

  async getCheckerById(id: string): Promise<AudienceChecker> {
    if (!id) {
      throw new ValidationError("Checker ID is required");
    }

    try {
      const db = getDatabase();

      const checkerResult = await db
        .select()
        .from(audienceCheckers)
        .where(eq(audienceCheckers.id, id))
        .limit(1);

      if (checkerResult.length === 0) {
        throw new NotFoundError(`Checker with ID ${id} not found`);
      }

      const rulesResult = await db
        .select()
        .from(rules)
        .where(eq(rules.checkerId, id))
        .orderBy(rules.createdAt);

      const row = checkerResult[0];
      const checkerRules: Rule[] = rulesResult.map((r) => ({
        id: r.id,
        checkerId: r.checkerId,
        field: r.field,
        operator: r.operator,
        value: r.value ?? undefined,
        createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
      }));

      const checker: AudienceChecker = {
        id: row.id,
        campaignId: row.campaignId,
        name: row.name,
        rules: checkerRules,
        status: row.status as CheckerStatus,
        alignmentStatus: row.alignmentStatus ?? undefined,
        lastChecked: row.lastChecked?.toISOString() ?? undefined,
        createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
      };

      logger.debug("Retrieved checker with rules", {
        id,
        rulesCount: checkerRules.length,
      });
      return checker;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error("Error fetching checker", { id, error });
      throw error;
    }
  }

  async createChecker(data: CreateCheckerDto): Promise<AudienceChecker> {
    if (!data.campaignId?.trim()) {
      throw new ValidationError("Campaign ID is required");
    }
    if (!data.name?.trim()) {
      throw new ValidationError("Checker name is required");
    }

    // Verify campaign exists
    await campaignService.getCampaignById(data.campaignId);

    const id = uuidv4();

    try {
      const db = getDatabase();

      await db.insert(audienceCheckers).values({
        id,
        campaignId: data.campaignId,
        name: data.name,
        query: data.query || null,
        rules: data.rules ? JSON.stringify(data.rules) : null,
        alignmentReport: data.alignmentReport
          ? JSON.stringify(data.alignmentReport)
          : null,
        status: CheckerStatus.PENDING,
        alignmentStatus: data.alignmentReport
          ? `${data.alignmentReport.alignmentPercentage}%`
          : null,
        lastChecked: data.alignmentReport ? new Date() : null,
      });

      const checker = await this.getCheckerById(id);
      logger.info("Checker created", { id, name: data.name });
      return checker;
    } catch (error) {
      logger.error("Error creating checker", { data, error });
      throw error;
    }
  }

  async updateChecker(
    id: string,
    data: UpdateCheckerDto
  ): Promise<AudienceChecker> {
    if (!id) {
      throw new ValidationError("Checker ID is required");
    }

    const checker = await this.getCheckerById(id);

    try {
      const db = getDatabase();

      await db
        .update(audienceCheckers)
        .set({
          name: data.name ?? checker.name,
          query:
            data.query !== undefined
              ? data.query
              : (checker as any).query ?? null,
          rules: data.rules ? JSON.stringify(data.rules) : undefined,
          alignmentReport: data.alignmentReport
            ? JSON.stringify(data.alignmentReport)
            : undefined,
          status: (data.status ?? checker.status) as
            | "pending"
            | "active"
            | "inactive"
            | "completed",
          alignmentStatus: data.alignmentReport
            ? `${data.alignmentReport.alignmentPercentage}%`
            : data.alignmentStatus ?? checker.alignmentStatus ?? null,
          lastChecked: data.alignmentReport ? new Date() : undefined,
        })
        .where(eq(audienceCheckers.id, id));

      const updated = await this.getCheckerById(id);
      logger.info("Checker updated", { id });
      return updated;
    } catch (error) {
      logger.error("Error updating checker", { id, error });
      throw error;
    }
  }

  async deleteChecker(id: string): Promise<void> {
    if (!id) {
      throw new ValidationError("Checker ID is required");
    }

    await this.getCheckerById(id);

    try {
      const db = getDatabase();
      await db.delete(audienceCheckers).where(eq(audienceCheckers.id, id));
      logger.info("Checker deleted", { id });
    } catch (error) {
      logger.error("Error deleting checker", { id, error });
      throw error;
    }
  }

  async addRule(checkerId: string, data: CreateRuleDto): Promise<Rule> {
    if (!checkerId?.trim()) {
      throw new ValidationError("Checker ID is required");
    }
    if (!data.field?.trim()) {
      throw new ValidationError("Field is required");
    }
    if (!data.operator?.trim()) {
      throw new ValidationError("Operator is required");
    }

    await this.getCheckerById(checkerId);

    const ruleId = uuidv4();

    try {
      const db = getDatabase();

      await db.insert(rules).values({
        id: ruleId,
        checkerId,
        field: data.field,
        operator: data.operator,
        value: data.value ?? null,
      });

      const result = await db
        .select()
        .from(rules)
        .where(eq(rules.id, ruleId))
        .limit(1);

      const row = result[0];
      const rule: Rule = {
        id: row.id,
        checkerId: row.checkerId,
        field: row.field,
        operator: row.operator,
        value: row.value ?? undefined,
        createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
      };

      logger.info("Rule added", { ruleId, checkerId });
      return rule;
    } catch (error) {
      logger.error("Error adding rule", { checkerId, data, error });
      throw error;
    }
  }

  async deleteRule(ruleId: string): Promise<void> {
    if (!ruleId) {
      throw new ValidationError("Rule ID is required");
    }

    const db = getDatabase();

    const ruleResult = await db
      .select()
      .from(rules)
      .where(eq(rules.id, ruleId))
      .limit(1);

    if (ruleResult.length === 0) {
      throw new NotFoundError(`Rule with ID ${ruleId} not found`);
    }

    try {
      await db.delete(rules).where(eq(rules.id, ruleId));
      logger.info("Rule deleted", { ruleId });
    } catch (error) {
      logger.error("Error deleting rule", { ruleId, error });
      throw error;
    }
  }
}

export const checkerService = new CheckerService();
