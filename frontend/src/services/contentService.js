import api from './api';

export const blogService = {
  getAll: (params) => api.get('/blog', { params }),
  getById: (id) => api.get(`/blog/${id}`),
  create: (data) => api.post('/blog', data),
  update: (id, data) => api.put(`/blog/${id}`, data),
  delete: (id) => api.delete(`/blog/${id}`),
};

export const contactService = {
  send: (data) => api.post('/contact', data),
  getAll: (params) => api.get('/contact-messages', { params }),
  getById: (id) => api.get(`/contact-messages/${id}`),
  updateStatus: (id, status) => api.put(`/contact-messages/${id}/status`, { status }),
};

export const settingService = {
  publicSettings: () => api.get('/settings/public'),
  getAll: () => api.get('/settings'),
  update: (key, value) => api.put(`/settings/${key}`, { value }),
  bulkUpdate: (settings) => api.post('/settings/bulk', { settings }),
};

export const activityService = {
  getAll: (params) => api.get('/activity-logs', { params }),
};
