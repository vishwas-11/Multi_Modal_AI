"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.asyncHandler = exports.errorHandler = exports.createError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return (0, exports.createError)(message, 400);
};
const handleDuplicateKeyError = (err) => {
    const field = Object.keys(err.keyValue || {})[0];
    const message = `${field} already exists. Please use a different value.`;
    return (0, exports.createError)(message, 409);
};
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map((e) => e.message);
    const message = `Validation failed: ${errors.join('. ')}`;
    return (0, exports.createError)(message, 400);
};
const handleJWTError = () => (0, exports.createError)('Invalid token. Please login again.', 401);
const handleJWTExpiredError = () => (0, exports.createError)('Token expired. Please login again.', 401);
// Global error handler
const errorHandler = (err, _req, res, _next) => {
    let error = { ...err, message: err.message };
    error.statusCode = error.statusCode || 500;
    // Log in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error = handleCastError(err);
    }
    // Mongoose duplicate key
    if (err.code === 11000) {
        error = handleDuplicateKeyError(err);
    }
    // Mongoose validation error
    if (err.name === 'ValidationError' && err instanceof mongoose_1.default.Error.ValidationError) {
        error = handleValidationError(err);
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError')
        error = handleJWTError();
    if (err.name === 'TokenExpiredError')
        error = handleJWTExpiredError();
    // Multer errors
    if (err.name === 'MulterError') {
        error = (0, exports.createError)(`File upload error: ${err.message}`, 400);
    }
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// 404 handler
const notFound = (_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
};
exports.notFound = notFound;
//# sourceMappingURL=errorHandler.js.map