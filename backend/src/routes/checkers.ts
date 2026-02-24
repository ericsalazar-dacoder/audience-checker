/**
 * Checker Routes
 */

import { Router } from "express";
import { checkerController } from "../controllers/checkerController";

const router = Router();

router.get("/campaign/:campaignId", checkerController.getCheckersByCampaign);
router.post("/", checkerController.createChecker);
router.get("/:id", checkerController.getCheckerById);
router.put("/:id", checkerController.updateChecker);
router.delete("/:id", checkerController.deleteChecker);
router.post("/:checkerId/rules", checkerController.addRule);
router.delete("/rules/:ruleId", checkerController.deleteRule);

export default router;
