import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/helpers';

const NAV = [
  { to: '/',          label: 'Dashboard',  icon: '▦' },
  { to: '/expenses',  label: 'Expenses',   icon: '🧾' },
  { to: '/budget',    label: 'Budget',     icon: '🎯' },
];

export default function Sidebar({ budgetInfo }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pct = budgetInfo?.percentUsed || 0;
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-brand-500';

  return (
    <aside className="w-60 min-w-[240px] bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <span className="font-display text-lg text-gray-100">Spendwise</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-2">
          Menu
        </p>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Budget mini-widget */}
      {budgetInfo && (
        <div className="mx-3 mb-3 p-3 bg-gray-800 rounded-xl border border-gray-700">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
            Monthly Budget
          </p>
          <div className="flex justify-between items-baseline mb-1.5">
            <span
              className="text-base font-display"
              style={{ color: pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#3ecf8e' }}
            >
              {formatCurrency(budgetInfo.totalSpent)}
            </span>
            <span className="text-xs text-gray-500">
              / {formatCurrency(budgetInfo.budget)}
            </span>
          </div>
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-1">{pct}% used</p>
        </div>
      )}

      {/* User footer */}
      <div className="border-t border-gray-800 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-gray-500 hover:text-red-400 transition-colors text-lg"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
