"use strict";
/**
 * Checker Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const checkerController_1 = require("../controllers/checkerController");
const router = (0, express_1.Router)();
router.get("/campaign/:campaignId", checkerController_1.checkerController.getCheckersByCampaign);
router.post("/", checkerController_1.checkerController.createChecker);
router.get("/:id", checkerController_1.checkerController.getCheckerById);
router.put("/:id", checkerController_1.checkerController.updateChecker);
router.delete("/:id", checkerController_1.checkerController.deleteChecker);
router.post("/:checkerId/rules", checkerController_1.checkerController.addRule);
router.delete("/rules/:ruleId", checkerController_1.checkerController.deleteRule);
exports.default = router;
//# sourceMappingURL=checkers.js.map