import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { expensesAPI } from '../../api/expenses';
import { getCurrentMonth } from '../../utils/helpers';

export default function AppLayout() {
  const [budgetInfo, setBudgetInfo] = useState(null);

  // Fetch summary for sidebar budget widget
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await expensesAPI.getAnalytics(getCurrentMonth());
        setBudgetInfo(data.data.summary);
      } catch { /* silent */ }
    };
    load();

    // Refresh on custom event (triggered after budget update / expense CRUD)
    const handler = () => load();
    window.addEventListener('spendwise:refresh', handler);
    return () => window.removeEventListener('spendwise:refresh', handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <Sidebar budgetInfo={budgetInfo} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
