import { createSlice } from '@reduxjs/toolkit';

const parseUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) ?? null;
  } catch {
    return null;
  }
};

const initialState = {
  user: parseUser(),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  initializing: true,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      const u = action.payload.user;
      state.user = u?.user ?? u;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    updateUser: (state, action) => {
      const u = action.payload;
      state.user = u?.user ?? u;
    },
    setCredentials: (state, action) => {
      const u = action.payload.user;
      state.user = u?.user ?? u;
      state.token = action.payload.token;
      state.isAuthenticated = !!action.payload.token;
    },
    finishInitializing: (state) => {
      state.initializing = false;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  setCredentials,
  finishInitializing,
} = authSlice.actions;

export default authSlice.reducer;
