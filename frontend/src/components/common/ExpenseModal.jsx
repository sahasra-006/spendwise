import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CATEGORIES, toInputDate } from '../../utils/helpers';

const EMPTY = {
  description: '',
  amount: '',
  category: 'Food & Dining',
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function ExpenseModal({ isOpen, onClose, onSave, expense }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const isEdit = !!expense;

  useEffect(() => {
    if (isOpen) {
      setForm(
        expense
          ? {
              description: expense.description,
              amount:      expense.amount,
              category:    expense.category,
              date:        toInputDate(expense.date),
              notes:       expense.notes || '',
            }
          : { ...EMPTY, date: new Date().toISOString().split('T')[0] }
      );
    }
  }, [isOpen, expense]);

  if (!isOpen) return null;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) return toast.error('Description is required');
    if (!form.amount || +form.amount <= 0) return toast.error('Enter a valid amount');
    if (!form.date) return toast.error('Date is required');

    try {
      setSaving(true);
      await onSave({ ...form, amount: parseFloat(form.amount) });
      toast.success(isEdit ? 'Expense updated!' : 'Expense added!');
      onClose();
      window.dispatchEvent(new Event('spendwise:refresh'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-800">
          <h2 className="font-display text-xl text-gray-100">
            {isEdit ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Category grid */}
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs border transition-all ${
                    form.category === cat.value
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="leading-tight text-center" style={{ fontSize: '10px' }}>
                    {cat.value.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <input
              className="input"
              placeholder="e.g. Grocery run, Netflix, Petrol..."
              value={form.description}
              onChange={set('description')}
              maxLength={200}
              required
            />
          </div>

          {/* Amount + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹)</label>
              <input
                className="input"
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={set('amount')}
                required
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={set('date')}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={set('notes')}
              maxLength={500}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
