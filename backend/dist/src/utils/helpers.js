"use strict";
/**
 * Async error handler wrapper for Express routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LogLevel = exports.validateEmail = exports.validateRequired = exports.asyncHandler = void 0;
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
/**
 * Validation utilities
 */
const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === "string" && !value.trim())) {
        throw new Error(`${fieldName} is required`);
    }
};
exports.validateRequired = validateRequired;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
/**
 * Logger utility
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    getTimestamp() {
        return new Date().toISOString();
    }
    formatMessage(level, message, data) {
        const timestamp = this.getTimestamp();
        const dataStr = data ? ` ${JSON.stringify(data)}` : "";
        return `[${timestamp}] [${level}] ${message}${dataStr}`;
    }
    debug(message, data) {
        if (process.env.NODE_ENV === "development") {
            console.log(this.formatMessage(LogLevel.DEBUG, message, data));
        }
    }
    info(message, data) {
        console.log(this.formatMessage(LogLevel.INFO, message, data));
    }
    warn(message, data) {
        console.warn(this.formatMessage(LogLevel.WARN, message, data));
    }
    error(message, data) {
        console.error(this.formatMessage(LogLevel.ERROR, message, data));
    }
}
exports.Logger = Logger;
exports.logger = new Logger();
//# sourceMappingURL=helpers.js.map