import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validate and return errors
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
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

// Auth validators
export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase, lowercase, and number'),
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('password').notEmpty().withMessage('Password is required'),
];

// Chat validators
export const chatValidator = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 10000 })
    .withMessage('Message too long (max 10000 chars)'),

  body('conversationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid conversation ID'),

  body('mediaIds')
    .optional()
    .isArray()
    .withMessage('mediaIds must be an array'),
];

// Analysis validators
export const analyzeValidator = [
  body('mediaId')
    .notEmpty()
    .withMessage('Media ID is required')
    .isMongoId()
    .withMessage('Invalid media ID'),

  body('prompt')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Prompt too long'),
];

// Compare validator
export const compareValidator = [
  body('mediaIds')
    .isArray({ min: 2, max: 10 })
    .withMessage('Provide between 2 and 10 media IDs to compare'),

  body('mediaIds.*')
    .isMongoId()
    .withMessage('Each media ID must be a valid MongoDB ObjectId'),

  body('prompt')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Prompt too long'),
];