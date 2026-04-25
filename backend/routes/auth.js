const express = require('express');
const router = express.Router();

const { register, login, getMe, updateBudget } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  registerRules,
  loginRules,
  budgetRules,
  validate,
} = require('../middleware/validators');

// POST /api/auth/register
router.post('/register', registerRules, validate, register);

// POST /api/auth/login
router.post('/login', loginRules, validate, login);

// GET /api/auth/me  (protected)
router.get('/me', protect, getMe);

// PUT /api/auth/budget  (protected)
router.put('/budget', protect, budgetRules, validate, updateBudget);

module.exports = router;
