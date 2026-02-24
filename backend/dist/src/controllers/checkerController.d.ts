/**
 * Checker Controller - Request handling layer
 */
import { Request, Response } from "express";
export declare class CheckerController {
    getCheckersByCampaign: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCheckersByCampaignNested: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCheckerById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createChecker: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateChecker: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteChecker: (req: Request, res: Response, next: import("express").NextFunction) => void;
    addRule: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteRule: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
export declare const checkerController: CheckerController;
//# sourceMappingURL=checkerController.d.ts.map