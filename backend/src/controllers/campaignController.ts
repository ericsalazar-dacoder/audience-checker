/**
 * Campaign Controller - Request handling layer
 */

import { Request, Response } from "express";
import { asyncHandler } from "../utils/helpers";
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  ApiResponse,
  Campaign,
} from "../types";
import { campaignService } from "../services/campaignService";

export class CampaignController {
  getAllCampaigns = asyncHandler(async (_req: Request, res: Response) => {
    const campaigns = await campaignService.getAllCampaigns();

    const response: ApiResponse<Campaign[]> = {
      success: true,
      data: campaigns,
      message: "Campaigns retrieved successfully",
    };

    res.json(response);
  });

  getCampaignById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const campaign = await campaignService.getCampaignById(id);

    const response: ApiResponse<Campaign> = {
      success: true,
      data: campaign,
      message: "Campaign retrieved successfully",
    };

    res.json(response);
  });

  createCampaign = asyncHandler(async (req: Request, res: Response) => {
    const dto: CreateCampaignDto = req.body;
    const campaign = await campaignService.createCampaign(dto);

    const response: ApiResponse<Campaign> = {
      success: true,
      data: campaign,
      message: "Campaign created successfully",
    };

    res.status(201).json(response);
  });

  updateCampaign = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: UpdateCampaignDto = req.body;
    const campaign = await campaignService.updateCampaign(id, dto);

    const response: ApiResponse<Campaign> = {
      success: true,
      data: campaign,
      message: "Campaign updated successfully",
    };

    res.json(response);
  });

  deleteCampaign = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await campaignService.deleteCampaign(id);

    const response: ApiResponse<null> = {
      success: true,
      message: "Campaign deleted successfully",
    };

    res.json(response);
  });
}

export const campaignController = new CampaignController();
