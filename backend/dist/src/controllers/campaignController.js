"use strict";
/**
 * Campaign Controller - Request handling layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignController = exports.CampaignController = void 0;
const helpers_1 = require("../utils/helpers");
const campaignService_1 = require("../services/campaignService");
class CampaignController {
    constructor() {
        this.getAllCampaigns = (0, helpers_1.asyncHandler)(async (_req, res) => {
            const campaigns = await campaignService_1.campaignService.getAllCampaigns();
            const response = {
                success: true,
                data: campaigns,
                message: "Campaigns retrieved successfully",
            };
            res.json(response);
        });
        this.getCampaignById = (0, helpers_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const campaign = await campaignService_1.campaignService.getCampaignById(id);
            const response = {
                success: true,
                data: campaign,
                message: "Campaign retrieved successfully",
            };
            res.json(response);
        });
        this.createCampaign = (0, helpers_1.asyncHandler)(async (req, res) => {
            const dto = req.body;
            const campaign = await campaignService_1.campaignService.createCampaign(dto);
            const response = {
                success: true,
                data: campaign,
                message: "Campaign created successfully",
            };
            res.status(201).json(response);
        });
        this.updateCampaign = (0, helpers_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const dto = req.body;
            const campaign = await campaignService_1.campaignService.updateCampaign(id, dto);
            const response = {
                success: true,
                data: campaign,
                message: "Campaign updated successfully",
            };
            res.json(response);
        });
        this.deleteCampaign = (0, helpers_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            await campaignService_1.campaignService.deleteCampaign(id);
            const response = {
                success: true,
                message: "Campaign deleted successfully",
            };
            res.json(response);
        });
    }
}
exports.CampaignController = CampaignController;
exports.campaignController = new CampaignController();
//# sourceMappingURL=campaignController.js.map