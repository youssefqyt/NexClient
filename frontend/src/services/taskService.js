import api from './api';

export const taskService = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),

  /** Bulk persist Kanban drag-and-drop order. */
  reorder: (tasks) => api.put('/tasks/reorder', { tasks }),

  addComment: (id, comment) => api.post(`/tasks/${id}/comments`, { comment }),
  deleteComment: (id, commentId) => api.delete(`/tasks/${id}/comments/${commentId}`),

  uploadAttachment: (id, file, onUploadProgress) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/tasks/${id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  deleteAttachment: (id, attachmentId) =>
    api.delete(`/tasks/${id}/attachments/${attachmentId}`),
};
