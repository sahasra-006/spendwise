import { getCategoryMeta, formatCurrency, formatDate } from '../../utils/helpers';

export default function ExpenseItem({ expense, onEdit, onDelete }) {
  const meta = getCategoryMeta(expense.category);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors group">
      {/* Category icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: meta.bg }}
      >
        {meta.emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{expense.description}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mr-1.5"
            style={{ background: meta.bg, color: meta.color }}
          >
            {expense.category}
          </span>
          {formatDate(expense.date)}
        </p>
      </div>

      {/* Amount */}
      <span className="font-display text-base font-medium text-red-400 ml-2 flex-shrink-0">
        − {formatCurrency(expense.amount)}
      </span>

      {/* Actions (visible on hover) */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
        <button
          onClick={() => onEdit(expense)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-700 transition-colors text-sm"
          title="Edit"
        >
          ✎
        </button>
        <button
          onClick={() => onDelete(expense._id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
