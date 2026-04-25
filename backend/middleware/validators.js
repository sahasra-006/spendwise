const { body, param, query, validationResult } = require('express-validator');
const { CATEGORIES } = require('../models/Expense');

/**
 * Middleware to run after validation rules — returns 400 if any rule fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── AUTH VALIDATORS ──
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── EXPENSE VALIDATORS ──
const expenseRules = [
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ min: 2, max: 200 }).withMessage('Description must be 2–200 characters'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('category').notEmpty().withMessage('Category is required')
    .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('date').notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be a valid ISO date (YYYY-MM-DD)'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

// ── BUDGET VALIDATOR ──
const budgetRules = [
  body('monthlyBudget').isFloat({ min: 0 }).withMessage('Budget must be a non-negative number'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  expenseRules,
  budgetRules,
};
