/**
 * Type definitions for domain entities
 */
export declare enum CampaignType {
    PLAY = "play",
    COMEBACK = "comeback",
    PROMOTIONAL = "promotional",
    SEASONAL = "seasonal"
}
export declare enum CheckerStatus {
    PENDING = "pending",
    ACTIVE = "active",
    INACTIVE = "inactive",
    COMPLETED = "completed"
}
export interface Campaign {
    id: string;
    name: string;
    description?: string;
    campaignType?: string;
    jbpmId?: string;
    activeFlag: boolean;
    lockedFlag: boolean;
    createdAt: string;
    updatedAt: string;
    checkerCount?: number;
}
export interface AudienceChecker {
    id: string;
    campaignId: string;
    name: string;
    query?: string;
    rules?: Rule[];
    alignmentReport?: AlignmentReport;
    status: CheckerStatus;
    alignmentStatus?: string;
    lastChecked?: string;
    createdAt: string;
    updatedAt: string;
}
export interface AlignmentReport {
    alignmentPercentage: number;
    totalConditions: number;
    matched: AlignmentMatch[];
    unmatched: AlignmentMatch[];
    extra: AlignmentMatch[];
}
export interface AlignmentMatch {
    table: string;
    column: string;
    condition?: string;
    expected?: string;
}
export interface Rule {
    id: string;
    checkerId: string;
    field: string;
    operator: string;
    value?: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreateCampaignDto {
    name: string;
    description?: string;
    campaignType?: string;
    jbpmId?: string;
}
export interface UpdateCampaignDto {
    name?: string;
    description?: string;
    campaignType?: string;
    jbpmId?: string;
    activeFlag?: boolean;
    lockedFlag?: boolean;
}
export interface CreateCheckerDto {
    campaignId: string;
    name: string;
    query?: string;
    rules?: Rule[];
    alignmentReport?: AlignmentReport;
}
export interface UpdateCheckerDto {
    name?: string;
    query?: string;
    rules?: Rule[];
    alignmentReport?: AlignmentReport;
    status?: CheckerStatus;
    alignmentStatus?: string;
}
export interface CreateRuleDto {
    field: string;
    operator: string;
    value?: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
//# sourceMappingURL=index.d.ts.map