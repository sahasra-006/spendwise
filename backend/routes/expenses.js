const express = require('express');
const router = express.Router();

const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getAnalytics,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { expenseRules, validate } = require('../middleware/validators');

// All expense routes require authentication
router.use(protect);

// GET  /api/expenses/analytics  — must be before /:id to avoid route conflict
router.get('/analytics', getAnalytics);

// GET  /api/expenses        — list with filter/search/pagination
// POST /api/expenses        — create new
router
  .route('/')
  .get(getExpenses)
  .post(expenseRules, validate, createExpense);

// GET    /api/expenses/:id  — get single
// PUT    /api/expenses/:id  — update
// DELETE /api/expenses/:id  — delete
router
  .route('/:id')
  .get(getExpense)
  .put(expenseRules, validate, updateExpense)
  .delete(deleteExpense);

module.exports = router;
