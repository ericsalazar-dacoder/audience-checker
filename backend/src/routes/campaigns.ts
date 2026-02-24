/**
 * Campaign Routes
 */

import { Router } from "express";
import { campaignController } from "../controllers/campaignController";
import { checkerController } from "../controllers/checkerController";

const router = Router();

router.get("/", campaignController.getAllCampaigns);
router.post("/", campaignController.createCampaign);
router.get("/:id", campaignController.getCampaignById);
router.put("/:id", campaignController.updateCampaign);
router.delete("/:id", campaignController.deleteCampaign);

// Nested route for checkers under a campaign
router.get("/:id/checkers", checkerController.getCheckersByCampaignNested);

export default router;
