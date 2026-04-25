import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { useAnalytics } from '../hooks/useExpenses';
import { useExpenses } from '../hooks/useExpenses';
import { useAuth } from '../context/AuthContext';
import {
  formatCurrency, getCurrentMonth, getMonthLabel,
  getCategoryMeta, CHART_COLORS,
} from '../utils/helpers';
import ExpenseModal from '../components/common/ExpenseModal';
import ExpenseItem from '../components/common/ExpenseItem';
import Spinner from '../components/common/Spinner';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [month, setMonth]         = useState(getCurrentMonth());
  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEdit]    = useState(null);

  const { analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useAnalytics(month);
  const { expenses, isLoading: expLoading, createExpense, updateExpense, deleteExpense } =
    useExpenses({ month, limit: 5, sortBy: 'date', order: 'desc' });

  // Build last-3-months tabs
  const monthTabs = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthTabs.push(ym);
  }

  useEffect(() => {
    const handler = () => refetchAnalytics();
    window.addEventListener('spendwise:refresh', handler);
    return () => window.removeEventListener('spendwise:refresh', handler);
  }, [refetchAnalytics]);

  const handleSave = async (data) => {
    if (editExpense) {
      await updateExpense(editExpense._id, data);
    } else {
      await createExpense(data);
    }
    refetchAnalytics();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(id);
      refetchAnalytics();
      toast.success('Expense deleted');
      window.dispatchEvent(new Event('spendwise:refresh'));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const summary = analytics?.summary;
  const pct     = summary?.percentUsed || 0;
  const barClr  = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#3ecf8e';

  // Doughnut data
  const catData = analytics?.categoryBreakdown || [];
  const doughnutData = {
    labels:   catData.map((c) => c.category),
    datasets: [{
      data:            catData.map((c) => c.total),
      backgroundColor: catData.map((c) => getCategoryMeta(c.category).color),
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  // Bar (trend) data
  const trend = analytics?.monthlyTrend || [];
  const barData = {
    labels: trend.map((m) => m.label),
    datasets: [{
      label: 'Spent',
      data:  trend.map((m) => m.total),
      backgroundColor: trend.map((_, i) => i === trend.length - 1 ? '#7c6af7' : 'rgba(124,106,247,0.4)'),
      borderRadius: 5,
      borderSkipped: false,
    }],
  };
  const barOpts = {
    ...CHART_OPTS,
    plugins: { ...CHART_OPTS.plugins, tooltip: { callbacks: { label: (ctx) => ' ' + formatCurrency(ctx.raw) } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#6b7280', font: { size: 11 }, callback: (v) => '₹' + Math.round(v / 1000) + 'k' },
        border: { display: false },
      },
    },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-gray-100">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">{getMonthLabel(month)}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month tabs */}
          <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
            {monthTabs.map((ym) => (
              <button
                key={ym}
                onClick={() => setMonth(ym)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  ym === month
                    ? 'bg-gray-700 text-gray-100'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {getMonthLabel(ym).split(' ')[0]}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setEdit(null); setModalOpen(true); }}
            className="btn-primary"
          >
            <span>＋</span> Add Expense
          </button>
        </div>
      </div>

      {analyticsLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Alert banners */}
          {pct >= 100 && (
            <div className="mb-4 flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              🚨 You've exceeded your budget by {formatCurrency(summary.totalSpent - summary.budget)}!
            </div>
          )}
          {pct >= 80 && pct < 100 && (
            <div className="mb-4 flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm">
              ⚠️ You've used {pct}% of your budget. {formatCurrency(summary.remaining)} remaining.
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="stat-card border-t-2 border-t-red-500/70">
              <span className="stat-label">Total Spent</span>
              <span className="stat-value text-red-400">{formatCurrency(summary?.totalSpent)}</span>
              <span className="stat-sub">{summary?.transactionCount} transactions</span>
            </div>
            <div className="stat-card border-t-2" style={{ borderTopColor: barClr }}>
              <span className="stat-label">Remaining</span>
              <span className="stat-value" style={{ color: barClr }}>
                {formatCurrency(Math.abs(summary?.remaining || 0))}
              </span>
              <span className="stat-sub">{(summary?.remaining || 0) >= 0 ? 'under budget' : 'over budget'}</span>
            </div>
            <div className="stat-card border-t-2 border-t-brand-500/70">
              <span className="stat-label">Monthly Budget</span>
              <span className="stat-value">{formatCurrency(summary?.budget)}</span>
              <span className="stat-sub">{pct}% used</span>
            </div>
            <div className="stat-card border-t-2 border-t-gray-600">
              <span className="stat-label">Avg / Transaction</span>
              <span className="stat-value">{formatCurrency(summary?.avgTransaction)}</span>
              <span className="stat-sub">this month</span>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Doughnut */}
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Spending by Category
              </p>
              {catData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
                  No data for this month
                </div>
              ) : (
                <div className="flex gap-6 items-center">
                  <div className="relative h-36 w-36 flex-shrink-0">
                    <Doughnut
                      data={doughnutData}
                      options={{ ...CHART_OPTS, cutout: '70%' }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    {catData.slice(0, 5).map((c) => {
                      const meta = getCategoryMeta(c.category);
                      return (
                        <div key={c.category} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: meta.color }} />
                          <span className="text-gray-400 flex-1 truncate">{c.category}</span>
                          <span className="text-gray-500">{c.percentage}%</span>
                          <span className="text-gray-300 font-medium">{formatCurrency(c.total)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bar trend */}
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                6-Month Trend
              </p>
              <div className="relative h-40">
                {trend.length > 0
                  ? <Bar data={barData} options={barOpts} />
                  : <div className="flex items-center justify-center h-full text-gray-600 text-sm">No trend data</div>
                }
              </div>
            </div>
          </div>

          {/* Recent expenses */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Recent Expenses
              </p>
              <Link to="/expenses" className="text-xs text-brand-400 hover:text-brand-300">
                View all →
              </Link>
            </div>
            {expLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">
                No expenses this month. Add your first one!
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((e) => (
                  <ExpenseItem
                    key={e._id}
                    expense={e}
                    onEdit={(exp) => { setEdit(exp); setModalOpen(true); }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEdit(null); }}
        onSave={handleSave}
        expense={editExpense}
      />
    </div>
  );
}
