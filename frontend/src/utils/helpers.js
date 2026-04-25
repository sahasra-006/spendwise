// ── CURRENCY FORMATTING ──
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

// ── DATE HELPERS ──
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const toInputDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
};

export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getMonthLabel = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

// ── CATEGORY METADATA ──
export const CATEGORIES = [
  { value: 'Food & Dining',      emoji: '🍔', color: '#f26d6d', bg: 'rgba(242,109,109,0.12)' },
  { value: 'Transportation',     emoji: '🚗', color: '#5b9cf6', bg: 'rgba(91,156,246,0.12)'  },
  { value: 'Bills & Utilities',  emoji: '⚡', color: '#f5a623', bg: 'rgba(245,166,35,0.12)'  },
  { value: 'Entertainment',      emoji: '🎬', color: '#b882f5', bg: 'rgba(184,130,245,0.12)' },
  { value: 'Health & Medical',   emoji: '💊', color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)'  },
  { value: 'Shopping',           emoji: '🛍️', color: '#f06292', bg: 'rgba(240,98,146,0.12)'  },
  { value: 'Education',          emoji: '📚', color: '#3ecfcf', bg: 'rgba(62,207,207,0.12)'  },
  { value: 'Travel',             emoji: '✈️', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  { value: 'Personal Care',      emoji: '🪥', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { value: 'Other',              emoji: '📦', color: '#9896b0', bg: 'rgba(152,150,176,0.12)' },
];

export const getCategoryMeta = (value) =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];

// ── CHART COLORS (matching categories) ──
export const CHART_COLORS = CATEGORIES.map((c) => c.color);

// ── CSV EXPORT ──
export const exportToCSV = (expenses, filename = 'expenses.csv') => {
  if (!expenses.length) return;

  const headers = ['Date', 'Description', 'Category', 'Amount (INR)', 'Notes'];
  const rows = expenses.map((e) => [
    formatDate(e.date),
    `"${e.description.replace(/"/g, '""')}"`,
    e.category,
    e.amount,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// ── TRUNCATE TEXT ──
export const truncate = (str, n = 40) =>
  str && str.length > n ? str.slice(0, n) + '…' : str;
