/**
 * Audience Checker Service - Business logic layer using Drizzle ORM
 */
import { AudienceChecker, CreateCheckerDto, UpdateCheckerDto, CreateRuleDto, Rule } from "../types";
export declare class CheckerService {
    getCheckersByCampaign(campaignId: string): Promise<AudienceChecker[]>;
    getCheckerById(id: string): Promise<AudienceChecker>;
    createChecker(data: CreateCheckerDto): Promise<AudienceChecker>;
    updateChecker(id: string, data: UpdateCheckerDto): Promise<AudienceChecker>;
    deleteChecker(id: string): Promise<void>;
    addRule(checkerId: string, data: CreateRuleDto): Promise<Rule>;
    deleteRule(ruleId: string): Promise<void>;
}
export declare const checkerService: CheckerService;
//# sourceMappingURL=checkerService.d.ts.map