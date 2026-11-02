import { createSlice } from '@reduxjs/toolkit';

const storedTheme = localStorage.getItem('theme') ?? 'light';
const storedLang = localStorage.getItem('language') ?? 'en';

const initialState = {
  theme: storedTheme, // 'light' | 'dark'
  language: storedLang,
  sidebarOpen: false,
  aiPanelOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', state.theme);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setAiPanelOpen: (state, action) => {
      state.aiPanelOpen = action.payload;
    },
    toggleAiPanel: (state) => {
      state.aiPanelOpen = !state.aiPanelOpen;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  setLanguage,
  setSidebarOpen,
  toggleSidebar,
  setAiPanelOpen,
  toggleAiPanel,
} = uiSlice.actions;

export default uiSlice.reducer;
