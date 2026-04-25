import api from './axiosInstance';

export const expensesAPI = {
  // GET /api/expenses with optional query params
  getAll: (params = {}) => api.get('/expenses', { params }),

  // GET /api/expenses/:id
  getOne: (id) => api.get(`/expenses/${id}`),

  // POST /api/expenses
  create: (data) => api.post('/expenses', data),

  // PUT /api/expenses/:id
  update: (id, data) => api.put(`/expenses/${id}`, data),

  // DELETE /api/expenses/:id
  delete: (id) => api.delete(`/expenses/${id}`),

  // GET /api/expenses/analytics?month=YYYY-MM
  getAnalytics: (month) => api.get('/expenses/analytics', { params: { month } }),
};
