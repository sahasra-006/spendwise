const Expense = require('../models/Expense');

/**
 * @desc    Get all expenses for logged-in user (with search, filter, pagination)
 * @route   GET /api/expenses
 * @access  Private
 */
const getExpenses = async (req, res, next) => {
  try {
    const {
      category,
      search,
      startDate,
      endDate,
      month,       // Format: YYYY-MM
      page = 1,
      limit = 20,
      sortBy = 'date',
      order = 'desc',
    } = req.query;

    // Build query — always filter by logged-in user
    const query = { user: req.user._id };

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Date range filter
    if (month) {
      const [year, mon] = month.split('-');
      query.date = {
        $gte: new Date(year, mon - 1, 1),
        $lte: new Date(year, mon, 0, 23, 59, 59),
      };
    } else {
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59');
      }
    }

    // Full-text search on description
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };

    // Execute query + count in parallel
    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Expense.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: expenses.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single expense by ID
 * @route   GET /api/expenses/:id
 * @access  Private
 */
const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id, // Ensure user owns this expense
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new expense
 * @route   POST /api/expenses
 * @access  Private
 */
const createExpense = async (req, res, next) => {
  try {
    const { description, amount, category, date, notes, isRecurring } = req.body;

    const expense = await Expense.create({
      user: req.user._id,
      description,
      amount,
      category,
      date: new Date(date),
      notes,
      isRecurring,
    });

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update expense
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
const updateExpense = async (req, res, next) => {
  try {
    const { description, amount, category, date, notes, isRecurring } = req.body;

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, // Scoped to user
      { description, amount, category, date: date ? new Date(date) : undefined, notes, isRecurring },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete expense
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard analytics (monthly summary + category breakdown)
 * @route   GET /api/expenses/analytics
 * @access  Private
 */
const getAnalytics = async (req, res, next) => {
  try {
    const { month } = req.query; // YYYY-MM
    const now = new Date();
    const [year, mon] = month
      ? month.split('-').map(Number)
      : [now.getFullYear(), now.getMonth() + 1];

    const startOfMonth = new Date(year, mon - 1, 1);
    const endOfMonth = new Date(year, mon, 0, 23, 59, 59);

    // ── 1. Monthly total + count ──
    const monthlyStats = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
    ]);

    // ── 2. Category breakdown ──
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // ── 3. Last 6 months trend ──
    const sixMonthsAgo = new Date(year, mon - 7, 1);
    const monthlyTrend = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: sixMonthsAgo, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // ── 4. Daily breakdown for current month ──
    const dailyBreakdown = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const stats = monthlyStats[0] || { totalAmount: 0, count: 0, avgAmount: 0 };
    const budget = req.user.monthlyBudget;
    const remaining = budget - stats.totalAmount;

    res.status(200).json({
      success: true,
      data: {
        month: `${year}-${String(mon).padStart(2, '0')}`,
        summary: {
          totalSpent: Math.round(stats.totalAmount * 100) / 100,
          transactionCount: stats.count,
          avgTransaction: Math.round((stats.avgAmount || 0) * 100) / 100,
          budget,
          remaining: Math.round(remaining * 100) / 100,
          percentUsed: budget > 0 ? Math.round((stats.totalAmount / budget) * 100) : 0,
        },
        categoryBreakdown: categoryBreakdown.map((c) => ({
          category: c._id,
          total: Math.round(c.total * 100) / 100,
          count: c.count,
          percentage:
            stats.totalAmount > 0
              ? Math.round((c.total / stats.totalAmount) * 100)
              : 0,
        })),
        monthlyTrend: monthlyTrend.map((m) => ({
          year: m._id.year,
          month: m._id.month,
          label: new Date(m._id.year, m._id.month - 1).toLocaleString('default', {
            month: 'short',
            year: '2-digit',
          }),
          total: Math.round(m.total * 100) / 100,
          count: m.count,
        })),
        dailyBreakdown: dailyBreakdown.map((d) => ({
          day: d._id,
          total: Math.round(d.total * 100) / 100,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getAnalytics,
};
