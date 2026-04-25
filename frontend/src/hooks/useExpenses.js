import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { expensesAPI } from '../api/expenses';

export function useExpenses(params = {}) {
  const [expenses, setExpenses]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);

  const fetchExpenses = useCallback(async (queryParams = params) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await expensesAPI.getAll(queryParams);
      setExpenses(data.data);
      setPagination({ total: data.total, page: data.page, totalPages: data.totalPages });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load expenses';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchExpenses(params);
  }, [JSON.stringify(params)]); // eslint-disable-line

  const createExpense = async (formData) => {
    const { data } = await expensesAPI.create(formData);
    setExpenses((prev) => [data.data, ...prev]);
    setPagination((p) => ({ ...p, total: p.total + 1 }));
    return data.data;
  };

  const updateExpense = async (id, formData) => {
    const { data } = await expensesAPI.update(id, formData);
    setExpenses((prev) => prev.map((e) => (e._id === id ? data.data : e)));
    return data.data;
  };

  const deleteExpense = async (id) => {
    await expensesAPI.delete(id);
    setExpenses((prev) => prev.filter((e) => e._id !== id));
    setPagination((p) => ({ ...p, total: p.total - 1 }));
  };

  return {
    expenses,
    pagination,
    isLoading,
    error,
    refetch: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}

export function useAnalytics(month) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await expensesAPI.getAnalytics(month);
      setAnalytics(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => { fetch(); }, [fetch]);

  return { analytics, isLoading, refetch: fetch };
}
