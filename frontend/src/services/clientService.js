import api from './api';

export const clientService = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),

  getCompanies: (params) => api.get('/clients/companies', { params }),
  createCompany: (data) => api.post('/clients/companies', data),
};
