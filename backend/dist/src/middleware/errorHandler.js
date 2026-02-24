"use strict";
/**
 * Error handling middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const helpers_1 = require("../utils/helpers");
const errorHandler = (error, req, res, _next) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let isOperational = false;
    if (error instanceof errors_1.AppError) {
        statusCode = error.statusCode;
        message = error.message;
        isOperational = error.isOperational;
    }
    else {
        message = error.message || message;
    }
    // Log error
    helpers_1.logger.error("Request error", {
        method: req.method,
        path: req.path,
        statusCode,
        message,
        isOperational,
    });
    const response = {
        success: false,
        error: message,
    };
    // Send error response
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
/**
 * 404 Not Found middleware
 */
const notFoundHandler = (req, res, _next) => {
    const response = {
        success: false,
        error: `Route ${req.method} ${req.path} not found`,
    };
    res.status(404).json(response);
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map