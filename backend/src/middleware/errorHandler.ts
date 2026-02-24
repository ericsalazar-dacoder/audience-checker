/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../utils/helpers";
import { ApiResponse } from "../types";

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let isOperational = false;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  } else {
    message = error.message || message;
  }

  // Log error
  logger.error("Request error", {
    method: req.method,
    path: req.path,
    statusCode,
    message,
    isOperational,
  });

  const response: ApiResponse<null> = {
    success: false,
    error: message,
  };

  // Send error response
  res.status(statusCode).json(response);
};

/**
 * 404 Not Found middleware
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const response: ApiResponse<null> = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  };

  res.status(404).json(response);
};
