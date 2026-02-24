"use strict";
/**
 * Campaign Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaignController_1 = require("../controllers/campaignController");
const checkerController_1 = require("../controllers/checkerController");
const router = (0, express_1.Router)();
router.get("/", campaignController_1.campaignController.getAllCampaigns);
router.post("/", campaignController_1.campaignController.createCampaign);
router.get("/:id", campaignController_1.campaignController.getCampaignById);
router.put("/:id", campaignController_1.campaignController.updateCampaign);
router.delete("/:id", campaignController_1.campaignController.deleteCampaign);
// Nested route for checkers under a campaign
router.get("/:id/checkers", checkerController_1.checkerController.getCheckersByCampaignNested);
exports.default = router;
//# sourceMappingURL=campaigns.js.map