import api from './api';

export const aiService = {
  status: () => api.get('/ai/status'),
  summarizeProject: (projectId) => api.post('/ai/summarize-project', { project_id: projectId }),
  statusUpdate: (projectId) => api.post('/ai/status-update', { project_id: projectId }),
  taskBreakdown: (goal, projectId) =>
    api.post('/ai/task-breakdown', { goal, project_id: projectId ?? null }),
  draftMessage: (context, tone, projectId) =>
    api.post('/ai/draft-message', { context, tone, project_id: projectId ?? null }),
  chat: (message, history = []) => api.post('/ai/chat', { message, history }),
};
