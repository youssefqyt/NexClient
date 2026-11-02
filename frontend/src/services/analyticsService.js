import api from './api';

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getRevenue: (year) => api.get('/analytics/revenue', { params: { year } }),
  getTasks: () => api.get('/analytics/tasks'),
  getClients: (year) => api.get('/analytics/clients', { params: { year } }),
};
