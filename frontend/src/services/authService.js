import api from './api';

const persist = (data) => {
  if (data?.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
};

export const authService = {
  login: async (email, password, remember) =>
    persist((await api.post('/login', { email, password, remember })).data),

  register: async (payload) => persist((await api.post('/register', payload)).data),

  logout: async () => {
    await api.post('/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user')) ?? null;
    } catch {
      return null;
    }
  },

  /** Fresh copy of the authenticated user from the API. */
  getMe: async () => {
    const res = (await api.get('/user')).data;
    const user = res?.user ?? res;
    if (user) localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  /** Profile + linked client record (client portals). */
  getProfile: async () => (await api.get('/profile')).data,

  updateProfile: async (data) => {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await api.post('/user/profile?_method=PUT', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    if (response.data.user) localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  /** Update profile AND the linked client record in one call. */
  updateMe: async (data) => {
    const response = await api.put('/profile', data);
    if (response.data.user) localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  updatePassword: async (data) => (await api.put('/user/password', data)).data,

  forgotPassword: async (email) => (await api.post('/forgot-password', { email })).data,

  resetPassword: async (data) => (await api.post('/reset-password', data)).data,
};
