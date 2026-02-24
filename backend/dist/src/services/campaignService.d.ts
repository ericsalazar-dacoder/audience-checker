/**
 * Campaign Service - Business logic layer using Drizzle ORM
 */
import { Campaign, CreateCampaignDto, UpdateCampaignDto } from "../types";
export declare class CampaignService {
    getAllCampaigns(): Promise<Campaign[]>;
    getCampaignById(id: string): Promise<Campaign>;
    createCampaign(data: CreateCampaignDto): Promise<Campaign>;
    updateCampaign(id: string, data: UpdateCampaignDto): Promise<Campaign>;
    deleteCampaign(id: string): Promise<void>;
}
export declare const campaignService: CampaignService;
//# sourceMappingURL=campaignService.d.ts.map