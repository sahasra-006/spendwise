import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useAnalytics } from '../hooks/useExpenses';
import { authAPI } from '../api/auth';
import {
  formatCurrency, getCurrentMonth, getMonthLabel, getCategoryMeta,
} from '../utils/helpers';
import Spinner from '../components/common/Spinner';

export default function BudgetPage() {
  const { user, updateUser }  = useAuth();
  const [month]               = useState(getCurrentMonth());
  const [budgetInput, setBudgetInput] = useState(user?.monthlyBudget || '');
  const [saving, setSaving]   = useState(false);

  const { analytics, isLoading, refetch } = useAnalytics(month);
  const summary  = analytics?.summary;
  const catData  = analytics?.categoryBreakdown || [];

  const pct     = summary?.percentUsed || 0;
  const barClr  = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#3ecf8e';
  const fillCls = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';

  const handleSaveBudget = async () => {
    const val = parseFloat(budgetInput);
    if (!val || val < 0) return toast.error('Enter a valid budget amount');
    try {
      setSaving(true);
      const { data } = await authAPI.updateBudget(val);
      updateUser(data.user);
      toast.success('Budget updated!');
      refetch();
      window.dispatchEvent(new Event('spendwise:refresh'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update budget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto page-enter">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-gray-100">Budget</h1>
        <p className="text-sm text-gray-500 mt-1">{getMonthLabel(month)}</p>
      </div>

      {/* Set budget card */}
      <div className="card mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Set Monthly Budget
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Budget Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input
                className="input !pl-7"
                type="number"
                min="0"
                step="1000"
                placeholder="e.g. 30000"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
              />
            </div>
          </div>
          <button
            onClick={handleSaveBudget}
            disabled={saving}
            className="btn-primary !py-2.5"
          >
            {saving ? 'Saving…' : 'Update Budget'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Alerts */}
          {pct >= 100 && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="font-medium">Budget Exceeded!</p>
                <p className="text-xs mt-0.5 text-red-300/80">
                  You've overspent by {formatCurrency(summary.totalSpent - summary.budget)}.
                  Consider reviewing your spending.
                </p>
              </div>
            </div>
          )}
          {pct >= 80 && pct < 100 && (
            <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium">Approaching Budget Limit</p>
                <p className="text-xs mt-0.5 text-amber-300/80">
                  {pct}% used. Only {formatCurrency(summary.remaining)} remaining this month.
                </p>
              </div>
            </div>
          )}
          {pct < 80 && summary?.budget > 0 && (
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-medium">On Track!</p>
                <p className="text-xs mt-0.5 text-emerald-300/80">
                  You have {formatCurrency(summary.remaining)} left this month.
                </p>
              </div>
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="stat-card">
              <span className="stat-label">Budget</span>
              <span className="stat-value">{formatCurrency(summary?.budget)}</span>
              <span className="stat-sub">monthly limit</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Spent</span>
              <span className="stat-value text-red-400">{formatCurrency(summary?.totalSpent)}</span>
              <span className="stat-sub">{pct}% of budget</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">{summary?.remaining >= 0 ? 'Remaining' : 'Overspent'}</span>
              <span className="stat-value" style={{ color: barClr }}>
                {formatCurrency(Math.abs(summary?.remaining || 0))}
              </span>
              <span className="stat-sub">{summary?.transactionCount} transactions</span>
            </div>
          </div>

          {/* Main progress bar */}
          <div className="card mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Budget Utilisation
            </p>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>{formatCurrency(summary?.totalSpent)} spent</span>
              <span>{formatCurrency(summary?.budget)} budget</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${fillCls}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <p className="text-right text-xs text-gray-500 mt-1.5">{pct}% used</p>
          </div>

          {/* Category breakdown */}
          <div className="card">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Category Breakdown — {getMonthLabel(month)}
            </p>
            {catData.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">
                No expenses this month
              </div>
            ) : (
              <div className="space-y-4">
                {catData.map((c) => {
                  const meta = getCategoryMeta(c.category);
                  const catPct = summary?.totalSpent > 0
                    ? Math.round((c.total / summary.totalSpent) * 100)
                    : 0;
                  return (
                    <div key={c.category}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 text-sm">
                          <span>{meta.emoji}</span>
                          <span className="text-gray-300">{c.category}</span>
                          <span className="text-xs text-gray-600">({c.count} items)</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-300 font-medium">{formatCurrency(c.total)}</span>
                          <span className="text-gray-600 ml-2">{catPct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${catPct}%`, background: meta.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
