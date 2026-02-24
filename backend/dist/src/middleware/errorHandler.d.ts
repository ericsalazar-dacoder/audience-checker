/**
 * Error handling middleware
 */
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
export declare const errorHandler: (error: Error | AppError, req: Request, res: Response, _next: NextFunction) => void;
/**
 * 404 Not Found middleware
 */
export declare const notFoundHandler: (req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map