import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useExpenses } from '../hooks/useExpenses';
import { CATEGORIES, formatCurrency, exportToCSV } from '../utils/helpers';
import ExpenseModal from '../components/common/ExpenseModal';
import ExpenseItem from '../components/common/ExpenseItem';
import Spinner from '../components/common/Spinner';

const SORT_OPTIONS = [
  { label: 'Date (Newest)',  sortBy: 'date',   order: 'desc' },
  { label: 'Date (Oldest)', sortBy: 'date',   order: 'asc'  },
  { label: 'Amount (High)', sortBy: 'amount', order: 'desc' },
  { label: 'Amount (Low)',  sortBy: 'amount', order: 'asc'  },
];

export default function ExpensesPage() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [sortIdx,  setSortIdx]  = useState(0);
  const [page,     setPage]     = useState(1);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);

  const sort = SORT_OPTIONS[sortIdx];

  const params = {
    ...(search   && { search }),
    ...(category && { category }),
    sortBy: sort.sortBy,
    order:  sort.order,
    page,
    limit: 15,
  };

  const {
    expenses, pagination, isLoading,
    createExpense, updateExpense, deleteExpense, refetch,
  } = useExpenses(params);

  const handleSave = async (data) => {
    if (editing) {
      await updateExpense(editing._id, data);
    } else {
      await createExpense(data);
    }
    window.dispatchEvent(new Event('spendwise:refresh'));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(id);
      toast.success('Expense deleted');
      window.dispatchEvent(new Event('spendwise:refresh'));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleExport = async () => {
    try {
      // Fetch all (no pagination) for export
      const { data } = await import('../api/expenses').then(m =>
        m.expensesAPI.getAll({ ...(search && { search }), ...(category && { category }), limit: 1000 })
      );
      exportToCSV(data.data);
      toast.success('CSV exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  // Debounced search
  const [searchTimer, setSearchTimer] = useState(null);
  const onSearchChange = (val) => {
    clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => { setSearch(val); setPage(1); }, 400));
  };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-gray-100">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total} total · {formatCurrency(totalSpent)} shown
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-ghost">
            <span>↓</span> Export CSV
          </button>
          <button
            onClick={() => { setEditing(null); setModal(true); }}
            className="btn-primary"
          >
            <span>＋</span> Add Expense
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 mb-5 p-4 bg-gray-900 border border-gray-800 rounded-xl">
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex-1 min-w-[180px]">
          <span className="text-gray-500 text-sm">🔍</span>
          <input
            className="bg-transparent outline-none text-sm text-gray-200 placeholder-gray-500 w-full"
            placeholder="Search description..."
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Category */}
        <select
          className="input !w-auto min-w-[160px]"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.emoji} {c.value}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          className="input !w-auto min-w-[160px]"
          value={sortIdx}
          onChange={(e) => { setSortIdx(+e.target.value); setPage(1); }}
        >
          {SORT_OPTIONS.map((o, i) => (
            <option key={i} value={i}>{o.label}</option>
          ))}
        </select>

        {/* Clear */}
        {(search || category) && (
          <button
            className="btn-ghost !px-3"
            onClick={() => { setSearch(''); setCategory(''); setPage(1); }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <div className="text-5xl mb-3">🧾</div>
          <p className="text-sm">
            {search || category ? 'No matching expenses found.' : 'No expenses yet. Add your first one!'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <ExpenseItem
              key={e._id}
              expense={e}
              onEdit={(exp) => { setEditing(exp); setModal(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            className="btn-ghost !px-3 !py-1.5 text-xs"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2)
            .map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  p === page
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          <button
            className="btn-ghost !px-3 !py-1.5 text-xs"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      <ExpenseModal
        isOpen={modal}
        onClose={() => { setModal(false); setEditing(null); }}
        onSave={handleSave}
        expense={editing}
      />
    </div>
  );
}
