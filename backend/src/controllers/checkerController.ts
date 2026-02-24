/**
 * Checker Controller - Request handling layer
 */

import { Request, Response } from "express";
import { asyncHandler } from "../utils/helpers";
import {
  CreateCheckerDto,
  UpdateCheckerDto,
  CreateRuleDto,
  ApiResponse,
  AudienceChecker,
  Rule,
} from "../types";
import { checkerService } from "../services/checkerService";

export class CheckerController {
  getCheckersByCampaign = asyncHandler(async (req: Request, res: Response) => {
    const { campaignId } = req.params;
    const checkers = await checkerService.getCheckersByCampaign(campaignId);

    const response: ApiResponse<AudienceChecker[]> = {
      success: true,
      data: checkers,
      message: "Checkers retrieved successfully",
    };

    res.json(response);
  });

  // Nested route handler for /api/campaigns/:id/checkers
  getCheckersByCampaignNested = asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params; // The campaign ID from nested route
      const checkers = await checkerService.getCheckersByCampaign(id);

      const response: ApiResponse<AudienceChecker[]> = {
        success: true,
        data: checkers,
        message: "Checkers retrieved successfully",
      };

      res.json(response);
    }
  );

  getCheckerById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const checker = await checkerService.getCheckerById(id);

    const response: ApiResponse<AudienceChecker> = {
      success: true,
      data: checker,
      message: "Checker retrieved successfully",
    };

    res.json(response);
  });

  createChecker = asyncHandler(async (req: Request, res: Response) => {
    const dto: CreateCheckerDto = req.body;
    const checker = await checkerService.createChecker(dto);

    const response: ApiResponse<AudienceChecker> = {
      success: true,
      data: checker,
      message: "Checker created successfully",
    };

    res.status(201).json(response);
  });

  updateChecker = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: UpdateCheckerDto = req.body;
    const checker = await checkerService.updateChecker(id, dto);

    const response: ApiResponse<AudienceChecker> = {
      success: true,
      data: checker,
      message: "Checker updated successfully",
    };

    res.json(response);
  });

  deleteChecker = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await checkerService.deleteChecker(id);

    const response: ApiResponse<null> = {
      success: true,
      message: "Checker deleted successfully",
    };

    res.json(response);
  });

  addRule = asyncHandler(async (req: Request, res: Response) => {
    const { checkerId } = req.params;
    const dto: CreateRuleDto = req.body;
    const rule = await checkerService.addRule(checkerId, dto);

    const response: ApiResponse<Rule> = {
      success: true,
      data: rule,
      message: "Rule added successfully",
    };

    res.status(201).json(response);
  });

  deleteRule = asyncHandler(async (req: Request, res: Response) => {
    const { ruleId } = req.params;
    await checkerService.deleteRule(ruleId);

    const response: ApiResponse<null> = {
      success: true,
      message: "Rule deleted successfully",
    };

    res.json(response);
  });
}

export const checkerController = new CheckerController();
