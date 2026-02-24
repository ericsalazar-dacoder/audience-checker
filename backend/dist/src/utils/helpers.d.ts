/**
 * Async error handler wrapper for Express routes
 */
import { Request, Response, NextFunction } from "express";
export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const asyncHandler: (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validation utilities
 */
export declare const validateRequired: (value: unknown, fieldName: string) => void;
export declare const validateEmail: (email: string) => boolean;
/**
 * Logger utility
 */
export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}
export declare class Logger {
    private getTimestamp;
    private formatMessage;
    debug(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
}
export declare const logger: Logger;
//# sourceMappingURL=helpers.d.ts.map