import api from './axiosInstance';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me'),
  updateBudget: (monthlyBudget) => api.put('/auth/budget', { monthlyBudget }),
};
