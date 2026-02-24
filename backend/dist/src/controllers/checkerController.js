"use strict";
/**
 * Checker Controller - Request handling layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkerController = exports.CheckerController = void 0;
const helpers_1 = require("../utils/helpers");
const checkerService_1 = require("../services/checkerService");
class CheckerController {
    constructor() {
        this.getCheckersByCampaign = (0, helpers_1.asyncHandler)(async (req, res) => {
            const { campaignId } = req.params;
            const checkers = await checkerService_1.checkerService.getCheckersByCampaign(campaignId);
            const response = {
                success: true,
                data: checkers,
                message: "Checkers retrieved successfully",
            };
            res.json(response);
        });
        // Nested route handler for /api/campaigns/:id/checkers
        this.getCheckersByCampaignNested = (0, helpers_1.asyncHandler)(async (req, res) => {
            const { id } = req.params; // The campaign ID from nested route
            const checkers = await checkerService_1.checkerService.getCheckersByCampaign(id);
            const response = {
                success: true,
                data: checkers,
                message: "Checkers retrieved successfully",
            };
            res.json(response);
        });
        this.getCheckerById = (0, helpers_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const checker = await checkerService_1.checkerService.getCheckerById(id);
            const response = {
                success: true,
                data: checker,
                message: "Checker retrieved successfully",
            };
            res.json(response);
        });
        this.createChecker = (0, helpers_1.asyncHandler)(async (req, res) => {
            const dto = req.body;
            const checker = await checkerService_1.checkerService.createChecker(dto);
            const response = {
                success: true,
                data: checker,
                message: "Checker created successfully",
            };
            res.status(201).json(response);
        });
        this.updateChecker = (0, helpers_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const dto = req.body;
            const checker = await checkerService_1.checkerService.updateChecker(id, dto);
            const response = {
                success: true,
                data: checker,
                message: "Checker updated successfully",
            };
            res.json(response);
        });
        this.deleteChecker = (0, helpers_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            await checkerService_1.checkerService.deleteChecker(id);
            const response = {
                success: true,
                message: "Checker deleted successfully",
            };
            res.json(response);
        });
        this.addRule = (0, helpers_1.asyncHandler)(async (req, res) => {
            const { checkerId } = req.params;
            const dto = req.body;
            const rule = await checkerService_1.checkerService.addRule(checkerId, dto);
            const response = {
                success: true,
                data: rule,
                message: "Rule added successfully",
            };
            res.status(201).json(response);
        });
        this.deleteRule = (0, helpers_1.asyncHandler)(async (req, res) => {
            const { ruleId } = req.params;
            await checkerService_1.checkerService.deleteRule(ruleId);
            const response = {
                success: true,
                message: "Rule deleted successfully",
            };
            res.json(response);
        });
    }
}
exports.CheckerController = CheckerController;
exports.checkerController = new CheckerController();
//# sourceMappingURL=checkerController.js.map