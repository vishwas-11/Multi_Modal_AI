"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareValidator = exports.analyzeValidator = exports.chatValidator = exports.loginValidator = exports.registerValidator = exports.validate = void 0;
const express_validator_1 = require("express-validator");
// Validate and return errors
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((err) => ({
                field: err.type === 'field' ? err.path : 'unknown',
                message: err.msg,
            })),
        });
        return;
    }
    next();
};
exports.validate = validate;
// Auth validators
exports.registerValidator = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase, lowercase, and number'),
];
exports.loginValidator = [
    (0, express_validator_1.body)('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
// Chat validators
exports.chatValidator = [
    (0, express_validator_1.body)('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ max: 10000 })
        .withMessage('Message too long (max 10000 chars)'),
    (0, express_validator_1.body)('conversationId')
        .optional()
        .isMongoId()
        .withMessage('Invalid conversation ID'),
    (0, express_validator_1.body)('mediaIds')
        .optional()
        .isArray()
        .withMessage('mediaIds must be an array'),
];
// Analysis validators
exports.analyzeValidator = [
    (0, express_validator_1.body)('mediaId')
        .notEmpty()
        .withMessage('Media ID is required')
        .isMongoId()
        .withMessage('Invalid media ID'),
    (0, express_validator_1.body)('prompt')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Prompt too long'),
];
// Compare validator
exports.compareValidator = [
    (0, express_validator_1.body)('mediaIds')
        .isArray({ min: 2, max: 10 })
        .withMessage('Provide between 2 and 10 media IDs to compare'),
    (0, express_validator_1.body)('mediaIds.*')
        .isMongoId()
        .withMessage('Each media ID must be a valid MongoDB ObjectId'),
    (0, express_validator_1.body)('prompt')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Prompt too long'),
];
//# sourceMappingURL=validators.js.map