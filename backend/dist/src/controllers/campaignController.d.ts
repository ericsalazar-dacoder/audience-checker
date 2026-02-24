/**
 * Campaign Controller - Request handling layer
 */
import { Request, Response } from "express";
export declare class CampaignController {
    getAllCampaigns: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCampaignById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createCampaign: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateCampaign: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteCampaign: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
export declare const campaignController: CampaignController;
//# sourceMappingURL=campaignController.d.ts.map