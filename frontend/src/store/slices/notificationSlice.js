import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  unreadCount: 0,
  loading: false,
  loaded: false,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.loaded = true;
      state.unreadCount = action.payload.filter((n) => !n.read).length;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    markReadLocal: (state, action) => {
      const item = state.items.find((n) => n.id === action.payload);
      if (item && !item.read) {
        item.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllReadLocal: (state) => {
      state.items = state.items.map((n) => ({ ...n, read: true }));
      state.unreadCount = 0;
    },
    removeLocal: (state, action) => {
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
  },
});

export const {
  setNotifications,
  setUnreadCount,
  setLoading,
  markReadLocal,
  markAllReadLocal,
  removeLocal,
} = notificationSlice.actions;

export default notificationSlice.reducer;
