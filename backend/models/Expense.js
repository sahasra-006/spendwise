const mongoose = require('mongoose');

// Predefined categories with metadata
const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Bills & Utilities',
  'Entertainment',
  'Health & Medical',
  'Shopping',
  'Education',
  'Travel',
  'Personal Care',
  'Other',
];

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for fast user-based queries
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [2, 'Description must be at least 2 characters'],
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      set: (v) => Math.round(v * 100) / 100, // Store max 2 decimal places
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── COMPOUND INDEX for efficient user + date queries ──
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });
expenseSchema.index({ user: 1, date: -1, category: 1 });

// ── VIRTUAL: formatted date string ──
expenseSchema.virtual('dateFormatted').get(function () {
  return this.date.toISOString().split('T')[0];
});

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.CATEGORIES = CATEGORIES;
