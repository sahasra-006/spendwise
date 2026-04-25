import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import AppLayout      from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import Dashboard      from './pages/Dashboard';
import ExpensesPage   from './pages/ExpensesPage';
import BudgetPage     from './pages/BudgetPage';
import Spinner        from './components/common/Spinner';

export default function App() {
  const { isInitialized } = useAuth();

  // Block rendering until auth state is verified (prevents flash)
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — all wrapped in AppLayout (sidebar + topbar) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/budget"   element={<BudgetPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
