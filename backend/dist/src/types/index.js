"use strict";
/**
 * Type definitions for domain entities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckerStatus = exports.CampaignType = void 0;
var CampaignType;
(function (CampaignType) {
    CampaignType["PLAY"] = "play";
    CampaignType["COMEBACK"] = "comeback";
    CampaignType["PROMOTIONAL"] = "promotional";
    CampaignType["SEASONAL"] = "seasonal";
})(CampaignType || (exports.CampaignType = CampaignType = {}));
var CheckerStatus;
(function (CheckerStatus) {
    CheckerStatus["PENDING"] = "pending";
    CheckerStatus["ACTIVE"] = "active";
    CheckerStatus["INACTIVE"] = "inactive";
    CheckerStatus["COMPLETED"] = "completed";
})(CheckerStatus || (exports.CheckerStatus = CheckerStatus = {}));
//# sourceMappingURL=index.js.map